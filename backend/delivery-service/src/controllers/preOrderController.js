import mongoose from "mongoose";
import StoreOrder from "../models/StoreOrder.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import Staff from "../../../staff-service/src/models/Staff.js";
import { getIO } from "../../../socket.js";
import { applyStoreOrderStatus } from "../services/storeOrderLifecycle.js";
import { syncCustomerOrderFromStore } from "../services/syncCustomerOrderFromStore.js";
import {
  formatIndiaDateString,
  shiftIndiaDateString,
} from "../../../../shared/date/indiaDate.js";

/**
 * Pre-order lifecycle
 *   Customer places next-day slot order → StoreOrder { status: "preorder_hold", preOrderStage: "pending" }
 *   Product Manager: pending → preparing → ready → forward
 *   Forward → { status: "packed", preOrderStage: "forwarded" } lands in the Delivery Manager's Pre-Orders tab
 *   Delivery Manager assigns a rider manually (Accept/Decline offer, no auto-rotation)
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CLOSED_STATUSES = ["delivered", "cancelled", "delivery_failed"];
const PREPARABLE_STAGES = ["pending", "preparing", "ready"];
const STAGE_TRANSITIONS = {
  pending: ["preparing", "ready"],
  preparing: ["ready", "pending"],
  ready: ["preparing"],
};

const todayIst = () => formatIndiaDateString();

function parseDate(value) {
  const s = String(value || "").trim();
  return DATE_RE.test(s) ? s : "";
}

/** Upcoming + still-open pre-orders when no explicit date is requested. */
function defaultDateScope() {
  const since = shiftIndiaDateString(todayIst(), -2);
  return {
    $or: [{ preOrderDate: { $gte: since } }, { status: { $nin: CLOSED_STATUSES } }],
  };
}

function sortPreOrders(a, b) {
  const byDate = String(a.preOrderDate || "").localeCompare(String(b.preOrderDate || ""));
  if (byDate) return byDate;
  const bySlot = String(a.preOrderSlot || "").localeCompare(String(b.preOrderSlot || ""));
  if (bySlot) return bySlot;
  return new Date(a.createdAt) - new Date(b.createdAt);
}

async function loadRiderMap(orders) {
  const ids = [
    ...new Set(
      orders.flatMap((o) =>
        [o.assignedRiderId, o.currentOfferDriverId].filter(Boolean).map(String)
      )
    ),
  ];
  if (!ids.length) return new Map();
  const riders = await DeliveryBoy.find({ _id: { $in: ids } }).select("name phone status");
  return new Map(riders.map((r) => [r._id.toString(), r]));
}

function riderSummary(rider) {
  return rider
    ? { id: rider._id.toString(), name: rider.name || rider.phone, phone: rider.phone, status: rider.status }
    : null;
}

function serializePreOrder(order, { riderMap, storeMap } = {}) {
  const json = order.toSafeJSON();
  const assigned = order.assignedRiderId ? riderMap?.get(String(order.assignedRiderId)) : null;
  const offered = order.currentOfferDriverId
    ? riderMap?.get(String(order.currentOfferDriverId))
    : null;
  const store = storeMap?.get(String(order.managerId));
  return {
    ...json,
    assignedRider: riderSummary(assigned),
    offeredRider: riderSummary(offered),
    ...(storeMap
      ? {
          store: store
            ? {
                id: store._id.toString(),
                storeName: store.storeName || `${store.area} Store`,
                area: store.area || "",
                city: store.city || "",
                managerName: store.name || "",
                managerPhone: store.phone || "",
              }
            : null,
        }
      : {}),
  };
}

function countSummary(orders) {
  const summary = {
    total: orders.length,
    pending: 0,
    preparing: 0,
    ready: 0,
    readyToAssign: 0,
    offered: 0,
    onTheWay: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const o of orders) {
    if (o.status === "preorder_hold") {
      if (summary[o.preOrderStage] != null) summary[o.preOrderStage] += 1;
    } else if (o.status === "packed") summary.readyToAssign += 1;
    else if (o.status === "offered") summary.offered += 1;
    else if (["assigned", "pickup_verified", "out_for_delivery"].includes(o.status)) summary.onTheWay += 1;
    else if (o.status === "delivered") summary.delivered += 1;
    else if (["cancelled", "delivery_failed"].includes(o.status)) summary.cancelled += 1;
  }
  return summary;
}

async function staffDisplayName(req) {
  let name = req.user?.email || "Product Manager";
  if (req.user?.role !== "admin" && req.user?.id) {
    const staff = await Staff.findById(req.user.id).select("name email");
    if (staff) name = staff.name || staff.email || name;
  }
  return name;
}

function emitToStore(managerId, event, payload) {
  try {
    getIO().to(`store_${managerId}`).emit(event, payload);
  } catch (err) {
    console.warn(`[preorder] socket emit ${event} failed:`, err.message);
  }
}

// ── Delivery Manager ────────────────────────────────────────────────────────

/** GET /api/delivery-managers/preorders?date=YYYY-MM-DD */
export const listManagerPreOrders = async (req, res, next) => {
  try {
    let manager = await DeliveryManager.findById(req.user.id);
    if (!manager && req.user.email) {
      manager = await DeliveryManager.findOne({ email: req.user.email });
    }
    if (!manager) {
      return res.status(404).json({ success: false, message: "Delivery manager not found" });
    }

    const date = parseDate(req.query.date);
    const filter = {
      managerId: manager._id,
      isPreOrder: true,
      ...(date ? { preOrderDate: date } : defaultDateScope()),
    };

    const orders = (await StoreOrder.find(filter)).sort(sortPreOrders);
    const riderMap = await loadRiderMap(orders);

    return res.json({
      success: true,
      today: todayIst(),
      tomorrow: shiftIndiaDateString(todayIst(), 1),
      darkStoreName: manager.storeName || `${manager.area} Dark Store`,
      summary: countSummary(orders),
      orders: orders.map((o) => serializePreOrder(o, { riderMap })),
    });
  } catch (error) {
    next(error);
  }
};

// ── Product Manager (staff) ─────────────────────────────────────────────────

/** GET /api/staff/preorders?date=&stage=&storeId= */
export const listPreOrdersForStaff = async (req, res, next) => {
  try {
    const date = parseDate(req.query.date);
    const stage = String(req.query.stage || "").trim().toLowerCase();
    const storeId = String(req.query.storeId || "").trim();

    const filter = {
      isPreOrder: true,
      ...(date ? { preOrderDate: date } : defaultDateScope()),
    };
    if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
      filter.managerId = storeId;
    }

    const orders = (await StoreOrder.find(filter)).sort(sortPreOrders);
    const [riderMap, stores] = await Promise.all([
      loadRiderMap(orders),
      DeliveryManager.find({ isActive: true }).select("storeName area city name phone"),
    ]);
    const storeMap = new Map(stores.map((s) => [s._id.toString(), s]));
    for (const id of new Set(orders.map((o) => String(o.managerId)))) {
      if (!storeMap.has(id)) {
        const extra = await DeliveryManager.findById(id).select("storeName area city name phone");
        if (extra) storeMap.set(id, extra);
      }
    }

    const summary = countSummary(orders);
    const visible = PREPARABLE_STAGES.includes(stage)
      ? orders.filter((o) => o.status === "preorder_hold" && o.preOrderStage === stage)
      : stage === "forwarded"
        ? orders.filter((o) => o.preOrderStage === "forwarded")
        : orders;

    return res.json({
      success: true,
      today: todayIst(),
      tomorrow: shiftIndiaDateString(todayIst(), 1),
      summary,
      stores: stores.map((s) => ({
        id: s._id.toString(),
        storeName: s.storeName || `${s.area} Store`,
        area: s.area || "",
        city: s.city || "",
      })),
      orders: visible.map((o) => serializePreOrder(o, { riderMap, storeMap })),
    });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/staff/preorders/:orderId/stage  body { stage: "pending" | "preparing" | "ready" } */
export const updatePreOrderStage = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const nextStage = String(req.body.stage || "").trim().toLowerCase();
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }
    if (!PREPARABLE_STAGES.includes(nextStage)) {
      return res.status(400).json({
        success: false,
        message: 'stage must be "pending", "preparing" or "ready"',
      });
    }

    const order = await StoreOrder.findOne({ _id: orderId, isPreOrder: true });
    if (!order) {
      return res.status(404).json({ success: false, message: "Pre-order not found" });
    }
    if (order.status !== "preorder_hold") {
      return res.status(400).json({
        success: false,
        message:
          order.status === "cancelled"
            ? "This pre-order was cancelled"
            : "This pre-order has already been forwarded to the Delivery Manager",
      });
    }

    const current = order.preOrderStage || "pending";
    if (current === nextStage) {
      return res.json({ success: true, message: "Stage unchanged", order: order.toSafeJSON() });
    }
    if (!(STAGE_TRANSITIONS[current] || []).includes(nextStage)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move pre-order from ${current} to ${nextStage}`,
      });
    }

    const now = new Date();
    order.preOrderStage = nextStage;
    if (nextStage === "preparing" && !order.preparingAt) order.preparingAt = now;
    if (nextStage === "ready") {
      if (!order.preparingAt) order.preparingAt = now;
      order.readyAt = now;
    }
    if (nextStage !== "ready") order.readyAt = undefined;
    await order.save();

    if (nextStage !== "pending") {
      await syncCustomerOrderFromStore(order, "preorder_preparing").catch((err) =>
        console.warn("[preorder] customer sync failed:", err.message)
      );
    }

    emitToStore(order.managerId, "preorder_updated", {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      preOrderStage: order.preOrderStage,
    });

    return res.json({
      success: true,
      message:
        nextStage === "ready"
          ? `#${order.orderNumber} marked ready — forward it to the Delivery Manager`
          : nextStage === "preparing"
            ? `Preparing #${order.orderNumber}`
            : `#${order.orderNumber} moved back to pending`,
      order: order.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/staff/preorders/forward  body { orderIds: string[], note?: string }
 * Hands prepared pre-orders to their dark store's Delivery Manager for manual rider assignment.
 */
export const forwardPreOrders = async (req, res, next) => {
  try {
    const rawIds = Array.isArray(req.body.orderIds)
      ? req.body.orderIds
      : req.params.orderId
        ? [req.params.orderId]
        : [];
    const orderIds = [...new Set(rawIds.map(String))].filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (!orderIds.length) {
      return res.status(400).json({ success: false, message: "Select at least one pre-order" });
    }
    if (orderIds.length > 200) {
      return res.status(400).json({ success: false, message: "Forward at most 200 pre-orders at once" });
    }

    const note = String(req.body.note || "").trim().slice(0, 500);
    const forwardedByName = await staffDisplayName(req);
    const forwardedBy = mongoose.Types.ObjectId.isValid(req.user?.id) ? req.user.id : null;

    const forwarded = [];
    const failed = [];

    for (const id of orderIds) {
      const now = new Date();
      const order = await StoreOrder.findOneAndUpdate(
        {
          _id: id,
          isPreOrder: true,
          status: "preorder_hold",
          preOrderStage: { $in: PREPARABLE_STAGES },
        },
        {
          $set: {
            status: "packed",
            packedAt: now,
            assignmentStatus: "NONE",
            preOrderStage: "forwarded",
            forwardedAt: now,
            forwardedBy,
            forwardedByName,
            pickupQrUnlocked: false,
            ...(note ? { preOrderNote: note } : {}),
          },
          $unset: { routeBatchWindowEndsAt: "" },
        },
        { new: true }
      );

      if (!order) {
        const existing = await StoreOrder.findById(id).select("orderNumber status preOrderStage isPreOrder");
        failed.push({
          id,
          orderNumber: existing?.orderNumber || "",
          message: !existing || !existing.isPreOrder
            ? "Pre-order not found"
            : existing.status === "cancelled"
              ? "Cancelled"
              : "Already forwarded",
        });
        continue;
      }

      if (!order.readyAt || !order.preparingAt) {
        order.preparingAt = order.preparingAt || now;
        order.readyAt = order.readyAt || now;
        await order.save();
      }

      await syncCustomerOrderFromStore(order, "packed").catch((err) =>
        console.warn("[preorder] customer sync failed:", err.message)
      );

      const payload = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: "packed",
        assignmentStatus: "NONE",
        isPreOrder: true,
        preOrderSlot: order.preOrderSlot,
        preOrderDate: order.preOrderDate,
        forwardedByName,
      };
      emitToStore(order.managerId, "preorder_forwarded", payload);
      emitToStore(order.managerId, "order_status_updated", payload);

      forwarded.push(order.toSafeJSON());
    }

    const status = forwarded.length ? 200 : 400;
    return res.status(status).json({
      success: forwarded.length > 0,
      message: forwarded.length
        ? `${forwarded.length} pre-order${forwarded.length > 1 ? "s" : ""} forwarded to Delivery Manager${
            failed.length ? ` · ${failed.length} skipped` : ""
          }`
        : failed[0]?.message || "Nothing forwarded",
      forwarded,
      failed,
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/staff/preorders/:orderId/cancel  body { reason } — only before forwarding */
export const cancelPreOrderByStaff = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const reason = String(req.body.reason || "").trim().slice(0, 300);
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: "A cancellation reason is required" });
    }

    const order = await StoreOrder.findOne({ _id: orderId, isPreOrder: true });
    if (!order) {
      return res.status(404).json({ success: false, message: "Pre-order not found" });
    }
    if (order.status !== "preorder_hold") {
      return res.status(400).json({
        success: false,
        message: "Only pre-orders that are not yet forwarded can be cancelled here",
      });
    }

    const byName = await staffDisplayName(req);
    order.notes = [order.notes, `Cancelled by ${byName} (Product Manager): ${reason}`]
      .filter(Boolean)
      .join("\n");
    await order.save();

    const result = await applyStoreOrderStatus({
      storeOrderId: order._id,
      status: "cancelled",
      restoreStockOnCancel: false,
    });
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      message: `Pre-order #${order.orderNumber} cancelled`,
      order: result.order.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
