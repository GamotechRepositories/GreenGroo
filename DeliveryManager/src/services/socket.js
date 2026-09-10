import { io } from "socket.io-client";
import { getApiBaseUrl } from "../config/apiBase.js";

let socket = null;
let currentManagerId = null;
const listeners = new Map();

function attachStoredListeners() {
  if (!socket) return;
  listeners.forEach((callbacks, event) => {
    callbacks.forEach((cb) => {
      socket.off(event, cb);
      socket.on(event, cb);
    });
  });
}

export function connectSocket(managerId) {
  if (!managerId) return null;
  currentManagerId = String(managerId);

  // Reuse existing socket (connected or reconnecting) — never spawn duplicates
  if (socket) {
    if (socket.connected) {
      socket.emit("join_store_room", { storeId: currentManagerId });
    }
    return socket;
  }

  const serverUrl = getApiBaseUrl();
  console.log(`[Socket] Connecting manager to ${serverUrl} (store_${currentManagerId})...`);

  socket = io(serverUrl, {
    transports: ["websocket", "polling"],
    upgrade: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log(`[Socket] Connected with ID: ${socket.id}`);
    if (currentManagerId) {
      socket.emit("join_store_room", { storeId: currentManagerId });
      console.log(`[Socket] Joined store_${currentManagerId}`);
    }
    attachStoredListeners();
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnected: ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.warn(`[Socket] Connection error: ${err.message}`);
  });

  attachStoredListeners();
  return socket;
}

export function ensureStoreRoom(managerId) {
  if (!managerId) return;
  connectSocket(managerId);
  if (socket?.connected) {
    socket.emit("join_store_room", { storeId: String(managerId) });
  }
}

export function subscribeToSocketEvent(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);

  if (socket) {
    socket.off(event, callback);
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
