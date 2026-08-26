import { io } from "socket.io-client";
import { getApiBaseUrl } from "../config/apiBase.js";

let socket = null;
let currentManagerId = null;
const listeners = new Map();

export function connectSocket(managerId) {
  if (!managerId) return null;
  currentManagerId = String(managerId);

  if (socket && socket.connected) {
    socket.emit("join_store_room", { storeId: currentManagerId });
    return socket;
  }

  const serverUrl = getApiBaseUrl();
  console.log(`[Socket] Connecting manager to ${serverUrl} (store_${currentManagerId})...`);

  socket = io(serverUrl, {
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log(`[Socket] Connected with ID: ${socket.id}`);
    if (currentManagerId) {
      socket.emit("join_store_room", { storeId: currentManagerId });
      console.log(`[Socket] Emitted join_store_room for store_${currentManagerId}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnected: ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.warn(`[Socket] Connection error: ${err.message}`);
  });

  // Re-attach registered listeners to active socket
  listeners.forEach((callbacks, event) => {
    callbacks.forEach((cb) => {
      socket.off(event, cb);
      socket.on(event, cb);
    });
  });

  return socket;
}

export function subscribeToSocketEvent(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);

  if (socket) {
    socket.on(event, callback);
  }

  return () => {
    if (listeners.has(event)) {
      listeners.get(event).delete(callback);
    }
    if (socket) {
      socket.off(event, callback);
    }
  };
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentManagerId = null;
  console.log("[Socket] Disconnected and cleaned up.");
}
