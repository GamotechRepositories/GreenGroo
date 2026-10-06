import { changeFeed } from "../shared/realtime/changeFeed.js";
import Order from "../legacy/models/order/Order.js";
import StoreOrder from "../delivery-service/src/models/StoreOrder.js";
import DeliveryBoy from "../delivery-service/src/models/DeliveryBoy.js";
import { getIO } from "../socket.js";
import { notifyStoreOrderStage } from "../legacy/services/orderNotificationDispatcher.js";
import {
  authorizeDriverForOrder,
  customerOrderIdOf,
  emitCustomerOrderStatus,
  emitOrderStatus,
  isOrderClosed,
  orderRoom,
  recordDriverLocation,
  resolveCustomerOrderForViewer,
} from "../delivery-service/src/services/orderTrackingService.js";

/** Fixes closer together than this are acknowledged but not broadcast. */
const LOCATION_MIN_INTERVAL_MS = 1000;
/** Re-check assignment / order status at most this often per socket + order. */
const DRIVER_AUTH_CACHE_MS = 15_000;

function reply(ack, body) {
  if (typeof ack === "function") ack(body);
}

function readFix(payload = {}) {
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null;
  const rawHeading = Number(payload.heading);
  const heading = Number.isFinite(rawHeading) ? ((rawHeading % 360) + 360) % 360 : null;
  const rawSpeed = Number(payload.speed);
  const speed = Number.isFinite(rawSpeed) && rawSpeed >= 0 ? rawSpeed : null;
  return { lat, lng, heading, speed };
}

/**
 * Live order tracking on the existing Socket.IO server. Identity comes from the
 * handshake JWT already verified in shared/socket.js (`socket.data.identity`).
 *
 *   join_order       { orderId }                      customer → joins order_<customerOrderId>
 *   leave_order      { orderId }
 *   driver_location  { orderId, lat, lng, heading }   rider (assigned, ready_to_cook / instant,
 *                                                     picked up) → location_update to the room
 *   order_status     server → room, every order type
 */
export function registerOrderTrackingSocket(io) {
  io.on("connection", (socket) => {
    const identity = socket.data.identity || null;
    const driverAuth = new Map();
    const lastFixAt = new Map();

    socket.on("join_order", async (payload = {}, ack) => {
      const orderId = String(payload?.orderId || "");
      if (!identity) {
        return reply(ack, { ok: false, code: "UNAUTHENTICATED", message: "Login required to track an order" });
      }
      try {
        const access = await resolveCustomerOrderForViewer(orderId, identity);
        if (!access.ok) return reply(ack, { ok: false, code: access.code, message: access.message });
        const roomOrderId = String(access.customerOrder._id);
        socket.join(orderRoom(roomOrderId));
        return reply(ack, { ok: true, orderId: roomOrderId });
      } catch (err) {
        console.warn("[tracking] join_order failed:", err.message);
        return reply(ack, { ok: false, code: "SERVER_ERROR", message: "Could not join order" });
      }
    });

    socket.on("leave_order", (payload = {}, ack) => {
      const orderId = String(payload?.orderId || "");
      if (orderId) socket.leave(orderRoom(orderId));
      reply(ack, { ok: true });
    });

    socket.on("driver_location", async (payload = {}, ack) => {
      if (identity?.role !== "delivery_boy") {
        return reply(ack, { ok: false, code: "FORBIDDEN", message: "Only delivery partners can send location" });
      }
      const orderId = String(payload?.orderId || "");
      const fix = readFix(payload);
      if (!orderId || !fix) {
        return reply(ack, { ok: false, code: "INVALID_PAYLOAD", message: "orderId, lat and lng are required" });
      }

      const now = Date.now();
      let auth = driverAuth.get(orderId);
      if (auth && isOrderClosed(auth.storeOrder._id)) {
        driverAuth.delete(orderId);
        return reply(ack, { ok: false, code: "ORDER_CLOSED", message: "Order is already closed" });
      }
      if (now - (lastFixAt.get(orderId) || 0) < LOCATION_MIN_INTERVAL_MS) {
        return reply(ack, { ok: true, throttled: true });
      }

      if (!auth || now - auth.at > DRIVER_AUTH_CACHE_MS) {
        try {
          const result = await authorizeDriverForOrder({ riderId: identity.id, orderId });
          if (!result.ok) {
            driverAuth.delete(orderId);
            return reply(ack, { ok: false, code: result.code, message: result.message });
          }
          const rider = await DeliveryBoy.findById(identity.id).select("name phone").lean();
          auth = { at: now, storeOrder: result.storeOrder, rider: rider || { _id: identity.id } };
          driverAuth.set(orderId, auth);
        } catch (err) {
          console.warn("[tracking] driver_location auth failed:", err.message);
          return reply(ack, { ok: false, code: "SERVER_ERROR", message: "Could not verify order" });
        }
      }

      lastFixAt.set(orderId, now);
      const { persisted } = await recordDriverLocation({
        storeOrder: auth.storeOrder,
        rider: auth.rider,
        ...fix,
      });
      return reply(ack, {
        ok: true,
        persisted,
        orderId: customerOrderIdOf(auth.storeOrder),
        storeOrderId: String(auth.storeOrder._id),
      });
    });
  });
}

/**
 * Emit `order_status` for status writes made anywhere (rider app, managers, crons,
 * admin tools) when MongoDB change streams are available. Writes made through
 * syncCustomerOrderFromStore / PATCH /status emit directly as well; repeats are deduped.
 */
export function startOrderStatusRelay() {
  const STORE_ORDERS = StoreOrder.collection.collectionName.toLowerCase();
  const ORDERS = Order.collection.collectionName.toLowerCase();

  changeFeed.on("change", (change) => {
    if (!change.id || !change.doc?.status) return;
    const coll = change.coll.toLowerCase();

    if (coll === STORE_ORDERS) relayRiderDeliveryChange(change);

    if (change.op === "insert" && coll === STORE_ORDERS) {
      setTimeout(() => void notifyStoreOrderStage(change.doc), NEW_ORDER_CONFIRM_DELAY_MS);
      return;
    }

    const statusChanged =
      change.op === "replace" ||
      (change.op === "update" && change.updatedFields?.some((field) => field === "status"));
    if (!statusChanged) return;

    if (coll === STORE_ORDERS) {
      emitOrderStatus(change.doc, change.doc.status);
      void notifyStoreOrderStage(change.doc);
    } else if (coll === ORDERS) {
      emitCustomerOrderStatus(change.doc);
    }
  });
}

/** Lets the "Order placed" push land before "Order confirmed" for brand-new orders. */
const NEW_ORDER_CONFIRM_DELAY_MS = 4000;
const RIDER_NOISE_FIELDS = new Set(["driverLocation", "updatedAt"]);
const riderByStoreOrder = new Map();

/**
 * Tell the assigned rider's app its delivery changed so it refreshes on demand
 * instead of polling. A rider who was just unassigned is told as well.
 */
function relayRiderDeliveryChange(change) {
  const fields = change.updatedFields || [];
  if (change.op === "update" && fields.length && fields.every((field) => RIDER_NOISE_FIELDS.has(field.split(".")[0]))) {
    return;
  }
  const io = getIO();
  if (!io) return;

  const orderId = String(change.id);
  const riderId = change.doc.assignedRiderId ? String(change.doc.assignedRiderId) : "";
  const previous = riderByStoreOrder.get(orderId) || "";
  const payload = { orderId, status: change.doc.status, at: new Date().toISOString() };

  if (riderId) io.to(`rider_${riderId}`).emit("active_delivery_updated", payload);
  if (previous && previous !== riderId) io.to(`rider_${previous}`).emit("active_delivery_updated", payload);

  const closed = ["delivered", "cancelled", "delivery_failed"].includes(change.doc.status);
  if (riderId && !closed) riderByStoreOrder.set(orderId, riderId);
  else riderByStoreOrder.delete(orderId);
}
