import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import StoreInventory from "../models/StoreInventory.js";
import StoreOrder from "../models/StoreOrder.js";
import Shift from "../models/Shift.js";
import CashSettlement from "../models/CashSettlement.js";
import { getIO } from "../../../socket.js";
import { dispatchNextRider } from "../services/dispatchService.js";
import { OFFER_TIMEOUT_SECONDS } from "../config/orderAssignmentConfig.js";
import { offerToSpecificDriver } from "../services/OrderAssignmentService.js";
import InventoryRequest from "../models/InventoryRequest.js";
import { deductOrderStock } from "../services/storeStockService.js";
import { seedManagerStore } from "../services/seedManagerStore.js";
import { pickDemoOrderItems } from "../data/storeProductCatalog.js";
import { geocodeAddressString } from "../../../legacy/services/reverseGeocodeService.js";
import { calculateRiderEarning } from "../services/ShiftEarningService.js";
import { applyStoreOrderStatus } from "../services/storeOrderLifecycle.js";
import { syncCustomerOrderFromStore } from "../services/syncCustomerOrderFromStore.js";
import {
  ensureTodayOnlineTracking,
  liveOnlineMinutes,
  formatOnlineMinutes,
} from "../utils/onlineHoursHelper.js";
import { buildRiderActivityHistory } from "../services/activityHistoryService.js";
import { areaMatches, placesEqual } from "../utils/matchPlace.js";
import {
  BATCHING_WAIT_MS,
  buildSuggestionPayload,
  evaluateRouteCompatibility,
  findAssignableRouteAnchors,
} from "../services/routeBatchingService.js";
import {
  attachOrdersToSameRider,
  tryAutoAttachOnPack,
  flushExpiredSameRouteWindows,
} from "../services/sameRouteAttachService.js";

const getManager = async (req) => {
  let manager = await DeliveryManager.findById(req.user.id);
  if (!manager && (req.user.email || req.user.phone)) {
    manager = await DeliveryManager.findOne({
      $or: [
        ...(req.user.email ? [{ email: req.user.email }] : []),
        ...(req.user.phone ? [{ phone: req.user.phone }] : []),
      ],
    });
  }
  if (!manager) {
    const err = new Error("Delivery manager not found");
    err.statusCode = 404;
    throw err;
  }
  return manager;
};

const stockMapForManager = async (managerId) => {
  const rows = await StoreInventory.find({ managerId, isActive: true });
  return new Map(rows.map((r) => [r.sku, r]));
};

/** Recalculate and persist rider fee when a delivered order still has ₹0. */
async function backfillRiderEarningIfMissing(order, darkStore) {
  if (!order || order.status !== "delivered") return order;
  if (Number(order.riderDeliveryEarning || 0) > 0) return order;

  try {
    const earningResult = await calculateRiderEarning({
      shiftId: order.shiftId || null,
      managerId: order.managerId,
      riderId: order.assignedRiderId,
      atDate: order.assignedAt || order.deliveredAt || order.createdAt || new Date(),
      storeLat: darkStore?.latitude ?? null,
      storeLng: darkStore?.longitude ?? null,
      customerLat: order.customerLat ?? null,
      customerLng: order.customerLng ?? null,
    });

    if (!(earningResult.riderEarning > 0)) return order;

    order.riderDeliveryEarning = earningResult.riderEarning;
    order.deliveryDistanceKm =
      order.deliveryDistanceKm || earningResult.distanceKm || 0;
    if (earningResult.earningSlab) {
      order.earningSlab = {
        minKm: earningResult.earningSlab.minKm,
        maxKm: earningResult.earningSlab.maxKm,
        riderAmount: earningResult.earningSlab.riderAmount,
      };
    }
    if (earningResult.shift?._id && !order.shiftId) {
      order.shiftId = earningResult.shift._id;
    }
    order.earningCalculatedAt = new Date();
    await order.save();

    if (order.assignedRiderId) {
      await DeliveryBoy.findByIdAndUpdate(order.assignedRiderId, {
        $inc: {
          todayEarnings: earningResult.riderEarning,
          totalLifetimeEarnings: earningResult.riderEarning,
        },
      });
    }
  } catch (_) {}

  return order;
}

const areaMatch = (manager) => ({
  $or: [
    { managerId: manager._id },
    {
      $and: [
        {
          $or: [{ managerId: null }, { managerId: { $exists: false } }],
        },
        {
          $or: [
            { cityId: manager.cityId, area: manager.area },
            { city: manager.city, area: manager.area },
          ],
        },
      ],
    },
  ],
});

/** Softer match for pending KYC — handles Hinjawadi/Hinjewadi and cityId mismatches */
function riderBelongsToManagerHub(rider, manager) {
  if (rider.managerId && String(rider.managerId) === String(manager._id)) {
    return true;
  }
  if (!areaMatches(rider.area, manager.area)) return false;
  if (placesEqual(rider.cityId, manager.cityId)) return true;
  if (placesEqual(rider.city, manager.city)) return true;
  // Area matched and rider not tied to another manager
  if (!rider.managerId) return true;
  return false;
}

const approvedFilter = {
  $or: [
    { verificationStatus: "approved" },
    { verificationStatus: { $exists: false } },
  ],
};

const riderQuery = (manager, extra = {}) => ({
  ...extra,
  $and: [areaMatch(manager), approvedFilter],
});

const serializeRider = (r) => ({
  id: r._id.toString(),
  name: r.name || "Rider",
  phone: r.phone,
  vehicleType: r.vehicleType,
  status: r.status,
  city: r.city,
  cityId: r.cityId,
  area: r.area,
  language: r.language,
  documents: r.documents,
  selfie: r.selfie,
  bankDetails: r.bankDetails,
  livenessPassed: r.livenessPassed,
  lastSeenAt: r.lastSeenAt,
  lastStatusAt: r.lastStatusAt,
  onboardingComplete: r.onboardingComplete,
  onboardingStep: r.onboardingStep,
  verificationStatus: r.verificationStatus || "pending",
  verifiedAt: r.verifiedAt,
  verificationNote: r.verificationNote || "",
  isActive: r.isActive,
  createdAt: r.createdAt,
  currentLocation:
    r.currentLocation?.lat != null && r.currentLocation?.lng != null
      ? {
          lat: r.currentLocation.lat,
          lng: r.currentLocation.lng,
          updatedAt: r.currentLocation.updatedAt,
        }
      : null,
  activeOrderId: r.activeOrderId ? String(r.activeOrderId) : null,
});

export const getDashboardSummary = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    await seedManagerStore(manager);
    const [
      incoming,
      inventoryCount,
      lowStock,
      ridersOnline,
      ridersTotal,
      pendingDrivers,
      pendingInventoryRequests,
    ] = await Promise.all([
      StoreOrder.countDocuments({
        managerId: manager._id,
        status: { $in: ["incoming", "order_received", "stock_issue"] },
      }),
      StoreInventory.countDocuments({ managerId: manager._id, isActive: true }),
      StoreInventory.countDocuments({
        managerId: manager._id,
        isActive: true,
        $expr: {
          $and: [
            { $gt: ["$stockCount", 0] },
            { $lte: ["$stockCount", { $ifNull: ["$lowStockThreshold", 10] }] },
          ],
        },
      }),
      DeliveryBoy.countDocuments(
        riderQuery(manager, { isActive: true, status: "online" })
      ),
      DeliveryBoy.countDocuments(riderQuery(manager)),
      DeliveryBoy.countDocuments({
        $and: [areaMatch(manager), { verificationStatus: "pending" }],
      }),
      InventoryRequest.countDocuments({
        managerId: manager._id,
        status: "pending",
      }),
    ]);

    return res.json({
      success: true,
      manager: manager.toSafeJSON(),
      summary: {
        incomingOrders: incoming,
        inventorySkus: inventoryCount,
        lowStockItems: lowStock,
        pendingInventoryRequests,
        ridersOnline,
        ridersTotal,
        pendingDrivers,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listIncomingOrders = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    await seedManagerStore(manager);
    await flushExpiredBatchWindows(manager._id);
    const statusFilter = req.query.status
      ? String(req.query.status).split(",")
      : ["incoming", "order_received", "stock_issue", "packed", "offered", "assigned", "out_for_delivery"];

    const orders = await StoreOrder.find({
      managerId: manager._id,
      status: { $in: statusFilter },
    }).sort({ createdAt: -1 });

    const riderIds = [
      ...new Set(
        orders.flatMap((o) =>
          [o.assignedRiderId, o.currentOfferDriverId, o.offeredRiderId].filter(Boolean)
        )
      ),
    ];
    const riders = riderIds.length
      ? await DeliveryBoy.find({ _id: { $in: riderIds } }).select("name phone status")
      : [];
    const riderMap = new Map(riders.map((r) => [r._id.toString(), r]));

    const deliveredCodIds = orders
      .filter(
        (o) =>
          o.status === "delivered" &&
          String(o.paymentMethod || "").toUpperCase() === "COD"
      )
      .map((o) => o._id);

    const settlements = deliveredCodIds.length
      ? await CashSettlement.find({ orderId: { $in: deliveredCodIds } }).select(
          "orderId amount status collectedAt submittedAt confirmedAt"
        )
      : [];
    const settlementMap = new Map(
      settlements.map((s) => [s.orderId.toString(), s])
    );

    const stockMap = await stockMapForManager(manager._id);

    // Backfill missing delivery-boy fees for delivered trips (older completions).
    for (const o of orders) {
      if (o.status === "delivered" && !(Number(o.riderDeliveryEarning || 0) > 0)) {
        await backfillRiderEarningIfMissing(o, manager);
      }
    }

    return res.json({
      success: true,
      darkStoreId: manager._id.toString(),
      darkStoreQrCode: `DARKSTORE_${manager._id}`,
      darkStoreName: manager.storeName || `${manager.area} Dark Store`,
      orders: orders.map((o) => {
        const json = o.toSafeJSON(stockMap);
        const assigned = o.assignedRiderId
          ? riderMap.get(o.assignedRiderId.toString())
          : null;
        const offered = o.currentOfferDriverId
          ? riderMap.get(o.currentOfferDriverId.toString())
          : null;
        const settlement = settlementMap.get(o._id.toString());
        const isCod = String(o.paymentMethod || "").toUpperCase() === "COD";
        const cashAmount =
          Number(settlement?.amount) ||
          Number(o.amountCollected) ||
          Number(o.amountToCollect) ||
          0;
        const cashStatus = settlement?.status || (isCod && o.status === "delivered" ? "PENDING" : null);

        return {
          ...json,
          assignedRider: assigned
            ? { id: assigned._id.toString(), name: assigned.name, phone: assigned.phone }
            : null,
          offeredRider: offered
            ? { id: offered._id.toString(), name: offered.name, phone: offered.phone }
            : null,
          cashSettlement: settlement
            ? {
                amount: settlement.amount,
                status: settlement.status,
                collectedAt: settlement.collectedAt,
                submittedAt: settlement.submittedAt,
                confirmedAt: settlement.confirmedAt,
              }
            : null,
          collectFromDriver:
            isCod && o.status === "delivered" && cashStatus !== "COMPLETED"
              ? {
                  amount: cashAmount,
                  driverName: assigned?.name || "Driver",
                  status: cashStatus || "PENDING",
                }
              : null,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manager marks order as "packed", which automatically triggers Round-Robin auto-dispatch!
 */
export const packOrder = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { orderId } = req.params;

    const order = await StoreOrder.findOne({
      _id: orderId,
      managerId: manager._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["incoming", "order_received", "stock_issue"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be packed (current status: ${order.status})`,
      });
    }

    const stockResult = await deductOrderStock(manager._id, order);
    if (stockResult.empty) {
      return res.status(400).json({
        success: false,
        message: "No fulfilable items left on this order",
      });
    }
    if (stockResult.shortages?.length) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot confirm order — some items are out of stock at this dark store. Request inventory or inform the customer.",
        shortages: stockResult.shortages,
      });
    }

    const now = new Date();
    order.status = "packed";
    order.packedAt = now;
    order.darkStoreId = manager._id;
    order.assignmentStatus = "SEARCHING_FOR_DRIVER";
    // 5-min same-route + QR hold starts only AFTER rider accepts (not at pack).
    order.routeBatchWindowEndsAt = undefined;
    order.pickupQrUnlocked = false;
    if (!order.darkStoreQrCode) {
      order.darkStoreQrCode = `DARKSTORE_${manager._id}`;
    }

    await flushExpiredBatchWindows(manager._id);
    await order.save();

    // Same-route accepted trip still waiting? Auto-attach this order to that rider.
    // Different route → autoAttached false → normal offer to another driver.
    const attachAttempt = await tryAutoAttachOnPack(order, manager);
    const sameRouteSuggestion = attachAttempt.suggestion || null;

    try {
      getIO().to(`store_${manager._id}`).emit("order_packed", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: attachAttempt.autoAttached ? "assigned" : "packed",
        assignmentStatus: attachAttempt.autoAttached
          ? "DRIVER_ASSIGNED"
          : order.assignmentStatus,
        routeBatchWindowEndsAt: null,
        pickupQrUnlocked: Boolean(attachAttempt.autoAttached),
        autoSameRouteAttached: Boolean(attachAttempt.autoAttached),
      });
      if (sameRouteSuggestion && !attachAttempt.autoAttached) {
        getIO().to(`store_${manager._id}`).emit("same_route_suggestion", sameRouteSuggestion);
      }
    } catch (err) {
      console.warn("[pack] socket emit failed:", err.message);
    }

    let dispatchResult = { success: false, skipped: true };
    if (!attachAttempt.autoAttached) {
      dispatchResult = await dispatchNextRider(order._id);
    }

    setTimeout(() => {
      flushExpiredBatchWindows(manager._id).catch(() => {});
    }, BATCHING_WAIT_MS + 500);

    const stockMap = await stockMapForManager(manager._id);
    const fresh = await StoreOrder.findById(order._id);
    return res.json({
      success: true,
      message: attachAttempt.autoAttached
        ? attachAttempt.message
        : sameRouteSuggestion
          ? `Order packed & searching rider. Nearby same-route order exists — will pair if that rider is in the 5-min wait.`
          : dispatchResult.success
            ? `Order packed — offer sent to ${dispatchResult.offeredRider?.name}.`
            : `Order packed. ${dispatchResult.message || "Waiting for rider…"}`,
      autoSameRouteAttached: Boolean(attachAttempt.autoAttached),
      sameRouteSuggestion,
      dispatchResult,
      order: fresh.toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear expired same-route windows and unlock pickup QR for assigned orders.
 */
async function flushExpiredBatchWindows(managerId) {
  return flushExpiredSameRouteWindows(managerId);
}

/** List same-route suggestions for manager UI */
export const listRouteSuggestions = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    await flushExpiredBatchWindows(manager._id);

    const waiting = await StoreOrder.find({
      managerId: manager._id,
      status: { $in: ["packed", "offered", "assigned"] },
      routeBatchWindowEndsAt: { $gt: new Date() },
      pickupQrScanned: { $ne: true },
    }).sort({ assignedAt: -1, packedAt: 1 });

    const suggestions = [];
    const seen = new Set();
    const openWindowOrders = waiting;

    // Pair every open-window order with every other recent/open order
    const candidates = await findAssignableRouteAnchors(StoreOrder, manager._id);
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i];
        const b = candidates[j];
        const key = [String(a._id), String(b._id)].sort().join(":");
        if (seen.has(key)) continue;
        const compat = evaluateRouteCompatibility(a, b, manager);
        if (!compat.compatible) continue;
        seen.add(key);
        suggestions.push(buildSuggestionPayload(a, b, manager, compat));
      }
    }

    return res.json({
      success: true,
      batchingWaitMs: BATCHING_WAIT_MS,
      openWindowOrders: openWindowOrders.map((o) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        status: o.status,
        assignmentStatus: o.assignmentStatus,
        routeBatchWindowEndsAt: o.routeBatchWindowEndsAt,
        customerName: o.customerName,
        customerAddress: o.customerAddress,
        assignedRiderId: o.assignedRiderId ? String(o.assignedRiderId) : null,
      })),
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/** Skip 5-min wait and find a new rider (Assign New Rider). */
export const dispatchPackedOrderNow = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { orderId } = req.params;
    const order = await StoreOrder.findOne({ _id: orderId, managerId: manager._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "packed") {
      return res.status(400).json({
        success: false,
        message: `Order must be packed to dispatch (status: ${order.status})`,
      });
    }

    order.assignmentStatus = "SEARCHING_FOR_DRIVER";
    order.routeBatchWindowEndsAt = undefined;
    await order.save();

    const dispatchResult = await dispatchNextRider(order._id);
    const stockMap = await stockMapForManager(manager._id);
    return res.json({
      success: true,
      message: dispatchResult.success
        ? `Offer sent to ${dispatchResult.offeredRider?.name}`
        : dispatchResult.message || "Searching for rider…",
      dispatchResult,
      order: (await StoreOrder.findById(order._id)).toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manager assigns two compatible orders to the same rider.
 * Body: { primaryOrderId, companionOrderId, riderId? }
 */
export const assignSameRouteOrders = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const primaryOrderId = String(req.body.primaryOrderId || req.params.orderId || "").trim();
    const companionOrderId = String(req.body.companionOrderId || "").trim();
    let riderId = String(req.body.riderId || "").trim();

    if (!primaryOrderId || !companionOrderId) {
      return res.status(400).json({
        success: false,
        message: "primaryOrderId and companionOrderId are required",
      });
    }

    const primary = await StoreOrder.findOne({ _id: primaryOrderId, managerId: manager._id });
    const companion = await StoreOrder.findOne({
      _id: companionOrderId,
      managerId: manager._id,
    });
    if (!primary || !companion) {
      return res.status(404).json({ success: false, message: "One or both orders not found" });
    }

    const compat = evaluateRouteCompatibility(primary, companion, manager);
    if (!riderId) {
      riderId =
        (primary.assignedRiderId && String(primary.assignedRiderId)) ||
        (companion.assignedRiderId && String(companion.assignedRiderId)) ||
        "";
    }
    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "riderId is required when neither order has an assigned rider yet",
        suggestedCompatible: compat.compatible,
      });
    }

    const rider = await DeliveryBoy.findOne(
      riderQuery(manager, { _id: riderId, isActive: true })
    );
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found for this store" });
    }

    const { batchId } = await attachOrdersToSameRider({
      primary,
      companion,
      rider,
      manager,
      compat,
    });

    const stockMap = await stockMapForManager(manager._id);
    const freshPrimary = await StoreOrder.findById(primary._id);
    const freshCompanion = await StoreOrder.findById(companion._id);
    return res.json({
      success: true,
      message: `Both orders assigned to ${rider.name || rider.phone}`,
      compatible: compat.compatible,
      batchId,
      suggestedSequence: compat.suggestedSequence,
      primary: freshPrimary.toSafeJSON(stockMap),
      companion: freshCompanion.toSafeJSON(stockMap),
      rider: {
        id: rider._id.toString(),
        name: rider.name,
        phone: rider.phone,
        status: rider.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a demo order for testing the full Dark Store & Round-Robin workflow easily.
 */
export const createDemoStoreOrder = async (req, res, next) => {
  try {
    const manager = await getManager(req);

    // IF AND ONLY IF at least one driver is online for this store location/slot, then only allow incoming demo order
    const onlineDriversCount = await DeliveryBoy.countDocuments({
      $or: [
        { cityId: manager.cityId, area: manager.area },
        { city: manager.city, area: manager.area },
      ],
      status: "online",
      isActive: true,
    });

    if (onlineDriversCount === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No delivery driver is currently online for this location/slot. Please bring a driver online first to receive/create incoming orders.",
      });
    }

    await seedManagerStore(manager);
    const inventory = await StoreInventory.find({
      managerId: manager._id,
      isActive: true,
    }).lean();
    const demoItems = pickDemoOrderItems(inventory, 3);
    if (demoItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No catalog items in this dark store to create an order",
      });
    }

    const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
    const demoAddress =
      req.body.customerAddress ||
      "In front of Balewadi Stadium Gate, Mahalunge Road, Pune";
    const demoCoords =
      (await geocodeAddressString(demoAddress)) ||
      (req.body.customerLat && req.body.customerLng
        ? { lat: Number(req.body.customerLat), lng: Number(req.body.customerLng) }
        : null);

    const itemsTotal = demoItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
    const demoDeliveryFee = 40;
    const amountToCollect = Math.round(itemsTotal + demoDeliveryFee);

    const newOrder = await StoreOrder.create({
      orderNumber: orderNum,
      managerId: manager._id,
      city: manager.city || "Pune",
      cityId: manager.cityId || "pune",
      area: manager.area || "Mahalunge",
      customerName: req.body.customerName || "Akash Patil (Testing)",
      customerPhone: req.body.customerPhone || "9876543210",
      customerAddress: demoAddress,
      customerLat: demoCoords?.lat ?? null,
      customerLng: demoCoords?.lng ?? null,
      items: demoItems,
      status: "order_received",
      darkStoreQrCode: `DARKSTORE_${manager._id}`,
      otpCode: "4321",
      paymentMethod: "COD",
      paymentStatus: "pending",
      amountToCollect,
    });

    try {
      getIO().to(`store_${manager._id}`).emit("new_order_received", {
        orderId: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        itemsCount: newOrder.items.length,
      });
    } catch (e) {}

    const stockMap = await stockMapForManager(manager._id);
    return res.json({
      success: true,
      message: `Demo order #${orderNum} created successfully!`,
      order: newOrder.toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};

export const listInventory = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    await seedManagerStore(manager);
    const items = await StoreInventory.find({
      managerId: manager._id,
      isActive: true,
    }).sort({ category: 1, name: 1 });

    return res.json({
      success: true,
      inventory: items.map((i) => i.toSafeJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const listRiders = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const riders = await DeliveryBoy.find(riderQuery(manager)).sort({ status: -1, createdAt: -1 });

    return res.json({
      success: true,
      riders: riders.map(serializeRider),
    });
  } catch (error) {
    next(error);
  }
};

/** New drivers who finished onboarding and await manager approval. */
export const listPendingDrivers = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const riders = await DeliveryBoy.find({
      verificationStatus: "pending",
    }).sort({ createdAt: -1, updatedAt: -1 });

    const filtered = riders.filter((r) => riderBelongsToManagerHub(r, manager));

    return res.json({
      success: true,
      riders: filtered.map(serializeRider),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyDriver = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { riderId } = req.params;
    const decision = String(req.body.decision || "").toLowerCase();
    const note = String(req.body.note || "").trim();
    const checkedItems = Array.isArray(req.body.checkedItems)
      ? req.body.checkedItems.map((x) => String(x))
      : [];

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'decision must be "approved" or "rejected"',
      });
    }

    let rider = await DeliveryBoy.findById(riderId);
    if (!rider || !riderBelongsToManagerHub(rider, manager)) {
      return res.status(404).json({
        success: false,
        message: "Driver not found in your hub area",
      });
    }

    const requiredChecks = [
      "aadhaar",
      "pan",
      "passport",
      "license",
      "rc",
      "insurance",
      "selfie",
      "bankDetails",
      "liveness",
    ];

    if (decision === "approved") {
      const missing = requiredChecks.filter((k) => !checkedItems.includes(k));
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Tick all document checkboxes before completing verification",
          missing,
        });
      }

      for (const key of [
        "aadhaar",
        "pan",
        "passport",
        "license",
        "rc",
        "insurance",
      ]) {
        if (!rider.documents[key]) rider.documents[key] = {};
        rider.documents[key].status = "verified";
      }
      if (!rider.selfie) rider.selfie = {};
      rider.selfie.status = "verified";
      rider.livenessPassed = true;
      rider.isActive = true;
      rider.verificationStatus = "approved";
      rider.managerId = manager._id;
      rider.storeId = manager._id.toString();
    } else {
      rider.isActive = false;
      rider.status = "offline";
      rider.verificationStatus = "rejected";
    }

      rider.verifiedAt = new Date();
      rider.verificationNote = note;
      await rider.save();

      if (decision === "approved") {
        try {
          const { notifyVerificationCompleted } = await import(
            "../services/RiderNotificationService.js"
          );
          await notifyVerificationCompleted(rider._id);
        } catch (err) {
          console.warn("[verifyDriver] notification failed:", err.message);
        }
      }

      try {
        getIO().to(`store_${manager._id}`).emit("rider_document_updated", {
          riderId: rider._id.toString(),
          documentType: "verification",
          verificationStatus: rider.verificationStatus,
          updatedAt: new Date().toISOString(),
        });
        getIO().to(`rider_${rider._id}`).emit("document_review_update", {
          documentType: "verification",
          verificationStatus: rider.verificationStatus,
          remarks: note,
        });
      } catch (err) {
        console.warn("[socket] verifyDriver emit failed:", err.message);
      }

    return res.json({
      success: true,
      message:
        decision === "approved"
          ? "Verified — driver can go online now"
          : "Driver application rejected",
      rider: serializeRider(rider),
    });
  } catch (error) {
    next(error);
  }
};

/** Manager informs customer that an item is out of stock. */
export const informCustomer = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { orderId } = req.params;
    const itemId = String(req.body.itemId || "");

    const order = await StoreOrder.findOne({
      _id: orderId,
      managerId: manager._id,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const stockMap = await stockMapForManager(manager._id);
    const stock = stockMap.get(item.sku);
    const available = stock ? stock.stockCount : 0;
    if (available >= item.quantity) {
      return res.status(400).json({
        success: false,
        message: "Item is available in stock — no need to inform customer",
      });
    }

    item.customerInformed = true;
    item.customerInformedAt = new Date();
    order.status = "stock_issue";
    order.notes = `Customer informed: "${item.name}" is not available.`;
    await order.save();

    // Notification stub — wire to notification-service later
    const notification = {
      to: order.customerPhone || order.customerName,
      message: `Sorry — "${item.name}" is currently not available for order ${order.orderNumber}.`,
      channel: "sms_stub",
      sentAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      message: "Customer informed about out-of-stock item",
      notification,
      order: order.toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};

/** Assign order to an available (preferably online) rider; deduct stock. */
export const assignOrder = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { orderId } = req.params;
    const riderId = String(req.body.riderId || "");

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "riderId is required",
      });
    }

    const order = await StoreOrder.findOne({
      _id: orderId,
      managerId: manager._id,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["incoming", "order_received", "stock_issue", "packed", "offered"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be offered (status: ${order.status})`,
      });
    }

    const rider = await DeliveryBoy.findOne(
      riderQuery(manager, { _id: riderId, isActive: true })
    );
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found for this store area",
      });
    }

    // Stock only if not already packed/deducted
    if (["incoming", "order_received", "stock_issue"].includes(order.status)) {
      const stockResult = await deductOrderStock(manager._id, order);
      if (stockResult.empty) {
        order.status = "cancelled";
        await order.save();
        return res.status(400).json({
          success: false,
          message: "No fulfilable items left on this order",
        });
      }
      if (stockResult.shortages?.length) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot assign — some items are out of stock. Inform customer or request restock.",
          shortages: stockResult.shortages,
        });
      }

      const informedIds = order.items
        .filter((i) => i.customerInformed)
        .map((i) => i._id);
      for (const id of informedIds) {
        order.items.pull(id);
      }
      if (order.items.length === 0) {
        order.status = "cancelled";
        await order.save();
        return res.status(400).json({
          success: false,
          message: "No fulfilable items left on this order",
        });
      }
      order.status = "packed";
      order.packedAt = order.packedAt || new Date();
      await order.save();
    }

    // Always send Accept/Decline offer — never force-assign
    const offerResult = await offerToSpecificDriver(order._id, rider._id);
    if (!offerResult.success) {
      return res.status(400).json({
        success: false,
        message: offerResult.message || "Could not send offer to rider",
      });
    }

    const freshStock = await stockMapForManager(manager._id);
    const fresh = await StoreOrder.findById(order._id);

    return res.json({
      success: true,
      message: `Offer sent to ${rider.name || rider.phone} — they must Accept or Decline (${OFFER_TIMEOUT_SECONDS}s)`,
      offered: true,
      timeoutSeconds: OFFER_TIMEOUT_SECONDS,
      order: fresh.toSafeJSON(freshStock),
      rider: {
        id: rider._id.toString(),
        name: rider.name,
        phone: rider.phone,
        status: rider.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Mark delivered (optional — stock already deducted on assign). */
export const markDelivered = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const order = await StoreOrder.findOne({
      _id: req.params.orderId,
      managerId: manager._id,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "assigned" && order.status !== "out_for_delivery") {
      return res.status(400).json({
        success: false,
        message: "Only assigned orders can be marked delivered",
      });
    }
    order.status = "delivered";
    order.deliveredAt = new Date();
    order.assignmentStatus = "DELIVERED";
    await order.save();

    if (order.assignedRiderId) {
      await DeliveryBoy.findByIdAndUpdate(order.assignedRiderId, {
        $set: { status: "online", lastStatusAt: new Date(), activeOrderId: null },
      });
    }

    await syncCustomerOrderFromStore(order, "delivered");

    const stockMap = await stockMapForManager(manager._id);
    return res.json({
      success: true,
      order: order.toSafeJSON(stockMap),
    });
  } catch (error) {
    next(error);
  }
};

/** Cancel a dark-store order and the linked customer order. */
export const cancelStoreOrder = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const order = await StoreOrder.findOne({
      _id: req.params.orderId,
      managerId: manager._id,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const result = await applyStoreOrderStatus({
      storeOrderId: order._id,
      status: "cancelled",
      restoreStockOnCancel: true,
    });
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    const stockMap = await stockMapForManager(manager._id);
    return res.json({
      success: true,
      message: result.message || "Order cancelled",
      order: result.order.toSafeJSON ? result.order.toSafeJSON(stockMap) : result.order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /drivers/:driverId
 * Returns complete aggregated driver details for manager view.
 */
export const getDriverDetails = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { driverId } = req.params;

    const rider = await DeliveryBoy.findOne({
      _id: driverId,
      $and: [areaMatch(manager)],
    });
    if (!rider) {
      return res.status(404).json({ success: false, message: "Delivery partner not found in your hub area" });
    }

    // Today's date in Indian Standard Time (IST, UTC+5:30)
    const todayISTDateString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Query shifts for this rider
    const shifts = await Shift.find({
      managerId: manager._id,
      "slots.bookings.deliveryPartnerId": rider._id,
    }).sort({ dateString: -1 }).limit(30);

    let bookedShiftsToday = 0;
    let completedShiftsToday = 0;
    const todayShifts = [];
    const recentShifts = [];

    for (const shift of shifts) {
      for (const slot of shift.slots || []) {
        for (const booking of slot.bookings || []) {
          if (booking.deliveryPartnerId?.toString() === rider._id.toString()) {
            const shiftItem = {
              shiftId: shift._id.toString(),
              shiftName: shift.name,
              shiftType: shift.type,
              dateString: shift.dateString,
              date: shift.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              bookingStatus: booking.status,
              bookedAt: booking.bookedAt,
              completedAt: booking.completedAt,
            };

            if (shift.dateString === todayISTDateString) {
              if (booking.status !== "CANCELLED") bookedShiftsToday++;
              if (booking.status === "COMPLETED") completedShiftsToday++;
              todayShifts.push(shiftItem);
            }
            recentShifts.push(shiftItem);
          }
        }
      }
    }

    // Live online minutes (includes current open session while partner is online)
    ensureTodayOnlineTracking(rider);
    const onlineMins = liveOnlineMinutes(rider);
    const onlineTimeStr = formatOnlineMinutes(onlineMins);

    return res.json({
      success: true,
      data: {
        driver: rider.toSafeJSON(),
        todayPerformance: {
          earnings: rider.todayEarnings || 0,
          completedOrders: rider.todayCompletedOrders || rider.todayOrderCount || 0,
          onlineMinutes: onlineMins,
          onlineTime: onlineTimeStr,
          shiftsBooked: bookedShiftsToday,
          completedShifts: completedShiftsToday,
        },
        wallet: {
          balance: rider.walletBalance || 0,
          todayEarnings: rider.todayEarnings || 0,
          lifetimeEarnings: rider.totalLifetimeEarnings || 0,
        },
        documents: rider.documents || {},
        selfie: rider.selfie || {},
        livenessPassed: rider.livenessPassed || false,
        livenessPassedAt: rider.livenessPassedAt || null,
        bankDetails: rider.bankDetails || {},
        todayShifts,
        recentShifts: recentShifts.slice(0, 60),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /drivers/:driverId/activity-history?range=week|month|year
 * Day-wise (or month for year) performance: online time, shifts, wallet, trips.
 */
export const getDriverActivityHistory = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { driverId } = req.params;
    const range = String(req.query.range || "week").trim().toLowerCase();

    const rider = await DeliveryBoy.findOne({
      _id: driverId,
      $and: [areaMatch(manager)],
    });
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found in your hub area",
      });
    }

    ensureTodayOnlineTracking(rider);
    const data = await buildRiderActivityHistory(rider, range);

    return res.json({
      success: true,
      data: {
        driverId: rider._id.toString(),
        driverName: rider.name || rider.phone,
        ...data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /drivers/:driverId/toggle-active
 * Toggles isActive status of delivery partner.
 */
export const toggleRiderActive = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { driverId } = req.params;
    const rider = await DeliveryBoy.findOne({
      _id: driverId,
      $and: [areaMatch(manager)],
    });
    if (!rider) {
      return res.status(404).json({ success: false, message: "Delivery partner not found in your hub area" });
    }

    rider.isActive = !rider.isActive;
    if (!rider.isActive) {
      rider.status = "offline";
    }
    await rider.save();

    return res.json({
      success: true,
      message: `Driver status set to ${rider.isActive ? "Active" : "Inactive"}`,
      isActive: rider.isActive,
      driver: rider.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
