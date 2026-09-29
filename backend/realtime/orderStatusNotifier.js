import { changeFeed } from "../shared/realtime/changeFeed.js";
import Order from "../legacy/models/order/Order.js";
import { notifyOrderStatus } from "../legacy/services/orderNotificationDispatcher.js";

const ORDERS = Order.collection.collectionName.toLowerCase();
// Explicit notify calls fire right after their save; give them first claim.
const SETTLE_MS = 2500;

/**
 * Customer push for every order status change, whichever service, rider app,
 * cron or admin tool wrote it. Duplicate announcements are prevented by the
 * dispatcher's per-(order, status) claim.
 */
export function startOrderStatusNotifier() {
  const pending = new Map();

  changeFeed.on("change", (change) => {
    if (change.coll.toLowerCase() !== ORDERS || !change.id) return;
    const statusChanged =
      change.op === "replace" ||
      (change.op === "update" && change.updatedFields?.some((field) => field === "status"));
    if (!statusChanged || !change.doc?.status) return;

    clearTimeout(pending.get(change.id));
    pending.set(
      change.id,
      setTimeout(() => {
        pending.delete(change.id);
        void notifyOrderStatus(change.doc, { source: "change-stream" });
      }, SETTLE_MS)
    );
  });
}
