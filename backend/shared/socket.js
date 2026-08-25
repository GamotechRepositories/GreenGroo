import { Server } from "socket.io";

let io = null;

/**
 * Attach Socket.io to the existing HTTP server.
 * Rooms: store_<storeId>, rider_<riderId>
 */
export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("[socket] connected:", socket.id);

    socket.on("join_store_room", (payload = {}) => {
      const storeId = payload?.storeId ? String(payload.storeId) : "";
      if (!storeId) return;
      const room = `store_${storeId}`;
      socket.join(room);
      console.log(`[socket] ${socket.id} joined ${room}`);
    });

    socket.on("join_rider_room", (payload = {}) => {
      const riderId = payload?.riderId ? String(payload.riderId) : "";
      if (!riderId) return;
      const room = `rider_${riderId}`;
      socket.join(room);
      console.log(`[socket] ${socket.id} joined ${room}`);
    });

    const joinNamed = (event, prefix, key) => {
      socket.on(event, (payload = {}) => {
        const id = payload?.[key] ? String(payload[key]) : "";
        if (!id) return;
        const room = `${prefix}_${id}`;
        socket.join(room);
      });
    };
    joinNamed("join_farmer_room", "farmer", "farmerId");
    joinNamed("join_manager_room", "manager", "managerId");
    joinNamed("join_driver_room", "driver", "driverId");
    joinNamed("join_vendor_room", "vendor", "vendorId");

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", socket.id, reason);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized — call initSocket(server) first");
  }
  return io;
}
