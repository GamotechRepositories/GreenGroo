/**
 * Simulate a rider driving from the dark store to the customer for one delivery
 * order, emitting `driver_location` over the existing Socket.IO server.
 *
 *   node scripts/fakeDriverLocation.mjs --order <storeOrderId> [options]
 *
 * Options:
 *   --url <http://localhost:5001>   backend URL (default http://localhost:$PORT)
 *   --interval <ms>                 time between fixes (default 3000)
 *   --steps <n>                     points along the path (default 40)
 *   --prepare                       put the order in out_for_delivery first (test data only!)
 *   --watch                         also join the order room as the customer and print events
 *
 * Reads MONGODB_URI / JWT_SECRET from backend/.env to load the order and sign a
 * rider token for its assigned rider.
 */
import "dotenv/config";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { io as connect } from "socket.io-client";
import StoreOrder from "../delivery-service/src/models/StoreOrder.js";
import DeliveryManager from "../delivery-service/src/models/DeliveryManager.js";
import EcommerceOrder from "../legacy/models/order/Order.js";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : true;
}

const orderId = arg("order");
const baseUrl = arg("url", `http://localhost:${process.env.PORT || 5001}`);
const intervalMs = Number(arg("interval", 3000));
const steps = Math.max(2, Number(arg("steps", 40)));
const secret = process.env.JWT_SECRET || "greengroo-secret";

if (!orderId || orderId === true) {
  console.error("Usage: node scripts/fakeDriverLocation.mjs --order <storeOrderId> [--prepare] [--watch]");
  process.exit(1);
}

function bearing(from, to) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(to.lng - from.lng)) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(toRad(to.lng - from.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** A slightly wavy path so the marker turns like a real ride. */
function buildPath(from, to, count) {
  const points = [];
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const wobble = Math.sin(t * Math.PI * 3) * 0.0006 * (1 - Math.abs(0.5 - t));
    points.push({
      lat: from.lat + (to.lat - from.lat) * t + wobble,
      lng: from.lng + (to.lng - from.lng) * t - wobble,
    });
  }
  return points;
}

async function loadOrder() {
  await mongoose.connect(process.env.MONGODB_URI);
  const order = await StoreOrder.findById(orderId);
  if (!order) throw new Error(`StoreOrder ${orderId} not found`);
  if (!order.assignedRiderId) throw new Error("Order has no assigned rider — assign one first");

  if (arg("prepare") && order.status !== "out_for_delivery") {
    await StoreOrder.updateOne(
      { _id: order._id },
      { $set: { status: "out_for_delivery", customerAddressUnlocked: true } }
    );
    order.status = "out_for_delivery";
    console.log("[fake] order moved to out_for_delivery");
  }

  const manager = await DeliveryManager.findById(order.managerId).select("latitude longitude storeName").lean();
  const customerOrder = order.sourceOrderId
    ? await EcommerceOrder.findById(order.sourceOrderId).select("user deliveryAddress").lean()
    : null;
  const from = { lat: Number(manager?.latitude), lng: Number(manager?.longitude) };
  const custLoc = customerOrder?.deliveryAddress?.location || {};
  const to = {
    lat: Number(order.customerLat ?? custLoc.lat),
    lng: Number(order.customerLng ?? custLoc.lng),
  };
  await mongoose.disconnect();

  if (![from.lat, from.lng].every(Number.isFinite)) throw new Error("Dark store has no latitude/longitude");
  if (![to.lat, to.lng].every(Number.isFinite)) throw new Error("Order has no customer coordinates");
  return { order, from, to, customerUserId: customerOrder?.user ? String(customerOrder.user) : null };
}

function watchAsCustomer(customerUserId, customerOrderId) {
  const token = jwt.sign({ id: customerUserId }, secret, { expiresIn: "1h" });
  const socket = connect(baseUrl, { transports: ["websocket"], auth: { token } });
  socket.on("connect", () => {
    socket.emit("join_order", { orderId: customerOrderId }, (res) => console.log("[customer] join_order →", res));
  });
  socket.on("location_update", (data) =>
    console.log(`[customer] location_update ${data.lat.toFixed(5)},${data.lng.toFixed(5)} heading=${Math.round(data.heading ?? 0)}`)
  );
  socket.on("order_status", (data) => console.log("[customer] order_status →", data.status, `(${data.storeStatus})`));
  return socket;
}

async function main() {
  const { order, from, to, customerUserId } = await loadOrder();
  console.log(`[fake] order ${order.orderNumber} status=${order.status} type=${order.orderType || "(derived)"}`);
  console.log(`[fake] ${from.lat},${from.lng} → ${to.lat},${to.lng} in ${steps} steps every ${intervalMs} ms`);

  const customerOrderId = order.sourceOrderId ? String(order.sourceOrderId) : null;
  const watcher = arg("watch") && customerUserId && customerOrderId ? watchAsCustomer(customerUserId, customerOrderId) : null;

  const token = jwt.sign({ id: String(order.assignedRiderId), role: "delivery_boy" }, secret, { expiresIn: "1h" });
  const socket = connect(baseUrl, { transports: ["websocket"], auth: { token } });
  const path = buildPath(from, to, steps);
  let index = 0;
  let timer = null;

  const stop = (code = 0) => {
    clearInterval(timer);
    socket.disconnect();
    watcher?.disconnect();
    process.exit(code);
  };

  socket.on("connect_error", (err) => {
    console.error("[fake] connect error:", err.message);
    stop(1);
  });

  socket.on("connect", () => {
    console.log(`[fake] rider socket connected (${socket.id})`);
    const tick = () => {
      if (index >= path.length) {
        console.log("[fake] reached destination");
        return stop(0);
      }
      const point = path[index];
      const next = path[Math.min(index + 1, path.length - 1)];
      const heading = index < path.length - 1 ? bearing(point, next) : bearing(path[index - 1] || point, point);
      socket.emit(
        "driver_location",
        { orderId: String(order._id), lat: point.lat, lng: point.lng, heading, speed: 6 },
        (res) => {
          const tag = res?.ok ? (res.persisted ? "ok (saved)" : "ok") : `rejected ${res?.code}: ${res?.message}`;
          console.log(`[fake] #${index} ${point.lat.toFixed(5)},${point.lng.toFixed(5)} → ${tag}`);
          if (res && !res.ok && ["ORDER_CLOSED", "NOT_TRACKABLE", "NOT_ASSIGNED", "FORBIDDEN"].includes(res.code)) {
            stop(1);
          }
        }
      );
      index += 1;
    };
    tick();
    timer = setInterval(tick, intervalMs);
  });

  process.on("SIGINT", () => stop(0));
}

main().catch((err) => {
  console.error("[fake]", err.message);
  process.exit(1);
});
