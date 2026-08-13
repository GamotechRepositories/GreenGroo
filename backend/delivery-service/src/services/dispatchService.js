import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import StoreOrder from "../models/StoreOrder.js";
import { getIO } from "../../../socket.js";

// Active in-memory timers for 10s round-robin offers
const activeOfferTimers = new Map();

/**
 * Executes Round-Robin dispatch for a packed store order.
 * - Finds eligible online riders for the dark store location
 * - Ranks by least completed orders today + longest waiting time
 * - Offers order to top candidate with 10s acceptance window
 * - Auto-rotates to next rider if declined or 10s timer expires
 */
export async function dispatchNextRider(orderId) {
  try {
    const order = await StoreOrder.findById(orderId);
    if (!order) return { success: false, message: "Order not found" };

    if (!["packed", "offered"].includes(order.status)) {
      return {
        success: false,
        message: `Order is in state '${order.status}', cannot dispatch.`,
      };
    }

    const manager = await DeliveryManager.findById(order.managerId);
    if (!manager) return { success: false, message: "Store manager not found" };

    // Clear existing timer if any
    if (activeOfferTimers.has(order._id.toString())) {
      clearTimeout(activeOfferTimers.get(order._id.toString()));
      activeOfferTimers.delete(order._id.toString());
    }

    // Exclude riders who already declined or timed out for this order
    const attemptedIds = (order.roundRobinRidersAttempted || []).map((id) =>
      id.toString()
    );

    const areaMatch = {
      $or: [
        { cityId: manager.cityId, area: manager.area },
        { city: manager.city, area: manager.area },
      ],
    };

    // Find active online riders for store location
    const eligibleRiders = await DeliveryBoy.find({
      $and: [
        areaMatch,
        {
          isActive: true,
          status: "online",
          _id: { $nin: attemptedIds },
          $or: [
            { verificationStatus: "approved" },
            { verificationStatus: { $exists: false } },
          ],
        },
      ],
    });

    if (!eligibleRiders || eligibleRiders.length === 0) {
      console.log(`[dispatch] No available riders for order ${order.orderNumber}`);
      order.status = "packed";
      order.offeredRiderId = null;
      order.offerExpiresAt = null;
      await order.save();

      try {
        getIO()
          .to(`store_${manager._id}`)
          .emit("dispatch_no_riders_available", {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            message:
              attemptedIds.length > 0
                ? "All online riders declined or timed out for this order."
                : "No online riders currently available near store.",
          });
      } catch (err) {
        console.warn("[socket] emit dispatch_no_riders_available failed:", err.message);
      }

      return {
        success: false,
        noRiders: true,
        message: "No available online riders for this store location",
      };
    }

    // Sort by Round-Robin logic:
    // 1. Least completed orders today (least load)
    // 2. Longest waiting since last order assignment or online toggle
    eligibleRiders.sort((a, b) => {
      const loadA = a.todayCompletedOrders || 0;
      const loadB = b.todayCompletedOrders || 0;
      if (loadA !== loadB) return loadA - loadB;

      const waitA = a.lastOrderAssignedAt
        ? new Date(a.lastOrderAssignedAt).getTime()
        : new Date(a.lastOnlineAt || a.updatedAt).getTime();
      const waitB = b.lastOrderAssignedAt
        ? new Date(b.lastOrderAssignedAt).getTime()
        : new Date(b.lastOnlineAt || b.updatedAt).getTime();
      return waitA - waitB; // Smallest timestamp = waiting longest
    });

    const selectedRider = eligibleRiders[0];
    const offerDurationMs = 10000; // 10 seconds countdown
    const expiresAt = new Date(Date.now() + offerDurationMs);

    order.status = "offered";
    order.offeredRiderId = selectedRider._id;
    order.offerExpiresAt = expiresAt;
    if (!order.roundRobinRidersAttempted.includes(selectedRider._id)) {
      order.roundRobinRidersAttempted.push(selectedRider._id);
    }
    await order.save();

    const orderTotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const estimatedEarnings = Math.round(orderTotal * 0.12 + 45);

    const offerPayload = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      darkStoreName: manager.storeName || `${manager.area} Dark Store`,
      darkStoreAddress:
        manager.storeAddress || `${manager.area}, ${manager.city}`,
      darkStoreQrCode: order.darkStoreQrCode || `DARKSTORE_${manager._id}`,
      itemCount: order.items.length,
      itemsSummary: order.items
        .map((i) => `${i.quantity}x ${i.name}`)
        .join(", "),
      estimatedEarnings,
      distanceKm: "1.4 km",
      offerExpiresAt: expiresAt.toISOString(),
      timeoutSeconds: 10,
    };

    console.log(
      `[dispatch] Offering order #${order.orderNumber} to rider ${selectedRider.name} (${selectedRider._id}) [10s countdown]`
    );

    // Emit live offer to selected rider's socket room
    try {
      getIO()
        .to(`rider_${selectedRider._id}`)
        .emit("order_offer_received", offerPayload);

      // Emit live status update to store manager room
      getIO()
        .to(`store_${manager._id}`)
        .emit("order_status_updated", {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          status: "offered",
          offeredRider: {
            id: selectedRider._id.toString(),
            name: selectedRider.name || selectedRider.phone,
            phone: selectedRider.phone,
          },
          offerExpiresAt: expiresAt.toISOString(),
        });
    } catch (err) {
      console.warn("[socket] emit order_offer_received failed:", err.message);
    }

    // Schedule 10-second backend timeout to auto-rotate if unanswered
    const timerId = setTimeout(async () => {
      activeOfferTimers.delete(order._id.toString());
      try {
        const freshOrder = await StoreOrder.findById(order._id);
        if (
          freshOrder &&
          freshOrder.status === "offered" &&
          freshOrder.offeredRiderId?.toString() === selectedRider._id.toString()
        ) {
          console.log(
            `[dispatch] 10s timer expired for rider ${selectedRider.name} on order ${freshOrder.orderNumber}. Rotating to next rider.`
          );
          freshOrder.offeredRiderId = null;
          freshOrder.offerExpiresAt = null;
          await freshOrder.save();

          try {
            getIO()
              .to(`rider_${selectedRider._id}`)
              .emit("order_offer_expired", {
                orderId: freshOrder._id.toString(),
                message: "10s response window expired.",
              });
          } catch (e) {}

          // Recursively dispatch to next rider in Round-Robin queue
          await dispatchNextRider(freshOrder._id);
        }
      } catch (err) {
        console.error("[dispatch] Timeout handler error:", err);
      }
    }, offerDurationMs + 500);

    activeOfferTimers.set(order._id.toString(), timerId);

    return {
      success: true,
      order: order.toSafeJSON(),
      offeredRider: {
        id: selectedRider._id.toString(),
        name: selectedRider.name,
      },
    };
  } catch (error) {
    console.error("[dispatch] dispatchNextRider error:", error);
    return { success: false, error: error.message };
  }
}
