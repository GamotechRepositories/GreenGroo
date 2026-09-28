import { Server } from "socket.io";
import { extractToken, identityFromToken } from "./realtime/identity.js";
import { registerLiveSocket } from "./realtime/liveViews.js";

let io = null;

/**
 * Connections authenticate with `auth: { token }` (JWT). Rooms are derived
 * from the token server-side (see realtime/identity.js):
 *   store_<id>/store:<id>, rider_<id>, farmer_<id>, manager_<id>, vendor_<id>,
 *   driver_<id>, user:<id>, role:<role>. Every socket also joins `public`.
 *
 * Unauthenticated sockets may still join rider/farmer rooms by id (the
 * Flutter apps do not send a token yet) unless SOCKET_REQUIRE_AUTH=true.
 */
const allowLegacyJoins = () => String(process.env.SOCKET_REQUIRE_AUTH || "").toLowerCase() !== "true";

function handshakeToken(socket) {
  const { auth = {}, headers = {}, query = {} } = socket.handshake || {};
  return extractToken(auth.token || headers.authorization || query.token);
}

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = handshakeToken(socket);
    if (token) socket.data.identity = await identityFromToken(token);
    next();
  });

  io.on("connection", (socket) => {
    const identity = socket.data.identity || null;
    socket.join("public");
    if (identity) identity.rooms.forEach((room) => socket.join(room));

    const ownsRoom = (room) => Boolean(identity?.rooms.includes(room)) || identity?.role === "admin";

    const joinChecked = (event, prefix, key, { legacy = false } = {}) => {
      socket.on(event, (payload = {}) => {
        const id = payload?.[key] ? String(payload[key]) : "";
        if (!id) return;
        const room = `${prefix}_${id}`;
        if (ownsRoom(room) || (!identity && legacy && allowLegacyJoins())) {
          socket.join(room);
        }
      });
    };
    joinChecked("join_store_room", "store", "storeId");
    joinChecked("join_rider_room", "rider", "riderId", { legacy: true });
    joinChecked("join_farmer_room", "farmer", "farmerId", { legacy: true });
    joinChecked("join_manager_room", "manager", "managerId");
    joinChecked("join_driver_room", "driver", "driverId");
    joinChecked("join_vendor_room", "vendor", "vendorId");

    socket.on("catalog:watch", (payload = {}) => {
      const storeId = payload?.storeId ? String(payload.storeId) : "none";
      [...socket.rooms]
        .filter((room) => room.startsWith("catalog:"))
        .forEach((room) => socket.leave(room));
      socket.join(`catalog:${storeId}`);
    });

    registerLiveSocket(socket);
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized — call initSocket(server) first");
  }
  return io;
}
