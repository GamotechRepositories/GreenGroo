import { EventEmitter } from "events";
import mongoose from "mongoose";

/**
 * Single MongoDB change stream for the whole database. Every write — API,
 * cron, script or a manual edit in Atlas — becomes a `change` event:
 *   { coll, op, id, doc, updatedFields }
 *
 * Change streams need a replica set (Atlas always is). On a standalone
 * mongod the feed switches to "fallback" mode, where `notifyWriteRequest`
 * (called after successful non-GET API requests) emits a wildcard change.
 */
export const changeFeed = new EventEmitter();
changeFeed.setMaxListeners(100);

let mode = "off";
let stream = null;
let resumeToken = null;
let retryMs = 1000;
let reopenTimer = null;

export function changeFeedMode() {
  return mode;
}

function normalize(change) {
  const updateDescription = change.updateDescription || null;
  return {
    coll: change.ns?.coll || "",
    op: change.operationType,
    id: change.documentKey?._id != null ? String(change.documentKey._id) : "",
    doc: change.fullDocument || null,
    updatedFields: updateDescription
      ? [
          ...Object.keys(updateDescription.updatedFields || {}),
          ...(updateDescription.removedFields || []),
        ]
      : null,
  };
}

function isUnsupported(err) {
  const message = String(err?.message || "");
  return (
    err?.code === 40573 ||
    err?.codeName === "Location40573" ||
    /replica set|not supported|only supported/i.test(message)
  );
}

function scheduleReopen() {
  if (reopenTimer || mode === "fallback") return;
  reopenTimer = setTimeout(() => {
    reopenTimer = null;
    open();
  }, retryMs);
  retryMs = Math.min(retryMs * 2, 30000);
}

function open() {
  if (!mongoose.connection?.db) {
    scheduleReopen();
    return;
  }
  const options = { fullDocument: "updateLookup" };
  if (resumeToken) options.resumeAfter = resumeToken;

  try {
    stream = mongoose.connection.watch(
      [{ $match: { operationType: { $in: ["insert", "update", "replace", "delete"] } } }],
      options
    );
  } catch (err) {
    if (isUnsupported(err)) return enterFallback(err);
    console.warn("[realtime] change stream open failed:", err.message);
    return scheduleReopen();
  }

  mode = "stream";
  stream.on("change", (change) => {
    resumeToken = change._id;
    retryMs = 1000;
    try {
      changeFeed.emit("change", normalize(change));
    } catch (err) {
      console.warn("[realtime] change handler failed:", err.message);
    }
  });
  stream.on("error", (err) => {
    try {
      stream?.close();
    } catch {
      /* already closed */
    }
    stream = null;
    if (isUnsupported(err)) return enterFallback(err);
    if (err?.code === 286 || err?.codeName === "ChangeStreamHistoryLost") resumeToken = null;
    console.warn("[realtime] change stream error, reopening:", err.message);
    scheduleReopen();
  });
}

function enterFallback(err) {
  mode = "fallback";
  console.warn(
    `[realtime] MongoDB change streams unavailable (${err?.message || "standalone server"}). ` +
      "Live views will refresh after API writes only. Use a replica set / Atlas for full realtime."
  );
}

export function startChangeFeed() {
  if (mode !== "off") return;
  open();
  console.log("[realtime] change feed started");
}

export function notifyWriteRequest() {
  if (mode !== "fallback") return;
  changeFeed.emit("change", { coll: "*", op: "unknown", id: "", doc: null, updatedFields: null });
}
