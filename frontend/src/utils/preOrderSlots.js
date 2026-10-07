/** Must match PREORDER_CHANGE_WINDOW_MS in the backend order controller. */
export const PREORDER_CHANGE_WINDOW_MS = 4 * 60 * 60 * 1000;

const NOT_STARTED_STORE_STATUSES = new Set(["preorder_hold", "incoming", "order_received", "stock_issue"]);

/** "13:02" → "1:02 PM". Values already carrying AM/PM are returned as-is. */
export function formatSlotTime(value) {
  const raw = String(value || "").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!match) return raw;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

/** "13:02 - 17:01" → "1:02 PM – 5:01 PM". */
export function formatSlotLabel(label) {
  const raw = String(label || "").trim();
  if (!raw) return "";
  const parts = raw.split(/\s+-\s+/);
  if (parts.length !== 2) return raw;
  return `${formatSlotTime(parts[0])} – ${formatSlotTime(parts[1])}`;
}

/** "2026-10-08" → "Thu, 8 Oct". */
export function formatPreOrderDay(dateStr) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
  if (!match) return "";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "12 left", "Full" or "" for slots without a capacity limit. */
export function slotAvailabilityText(slot) {
  if (!slot) return "";
  if (slot.isFull) return "Full";
  if (slot.remaining == null) return "Available";
  return `${slot.remaining} left`;
}

export function preOrderChangeDeadline(order) {
  const placedAt = new Date(order?.createdAt || 0).getTime();
  return placedAt ? new Date(placedAt + PREORDER_CHANGE_WINDOW_MS) : null;
}

/** True once the dark store has started packing the pre-order part. */
export function preOrderPackingStarted(order) {
  return (order?.storeParts || [])
    .filter((part) => part.isPreOrder && part.status !== "cancelled")
    .some((part) => !NOT_STARTED_STORE_STATUSES.has(part.status));
}

export function canReschedulePreOrder(order, now = Date.now()) {
  if (!order?.preOrderSlot) return false;
  if (["attempted", "cancelled", "delivered", "return"].includes(order.status)) return false;
  const deadline = preOrderChangeDeadline(order);
  if (!deadline || now > deadline.getTime()) return false;
  return !preOrderPackingStarted(order);
}
