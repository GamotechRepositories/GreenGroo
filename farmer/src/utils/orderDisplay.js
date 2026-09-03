export function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export function formatOrderDate(value) {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function orderTitle(filter) {
  return (
    {
      new: "New Orders",
      preparing: "Preparing",
      ready: "Ready for Pickup",
      completed: "Completed",
      rejected: "Rejected",
    }[filter] || "Orders"
  );
}

export function canAccept(status) {
  return canonicalOrderStatus(status) === "NEW";
}

export function canReject(status) {
  return canonicalOrderStatus(status) === "NEW";
}

export function canPrepare(status) {
  return ["ACCEPTED", "PREPARING", "PACKING"].includes(canonicalOrderStatus(status));
}

const ORDER_STATUS_ALIASES = {
  NEW: "NEW",
  New: "NEW",
  Confirmed: "NEW",
  Approved: "NEW",
  ACCEPTED: "ACCEPTED",
  Accepted: "ACCEPTED",
  PREPARING: "PREPARING",
  Preparing: "PREPARING",
  Processing: "PREPARING",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  "Ready for Pickup": "READY_FOR_PICKUP",
  REJECTED: "REJECTED",
  Rejected: "REJECTED",
  CANCELLED: "CANCELLED",
  Cancelled: "CANCELLED",
  COMPLETED: "COMPLETED",
  Completed: "COMPLETED",
};

export function canonicalOrderStatus(status) {
  return ORDER_STATUS_ALIASES[status] || status || "NEW";
}

export function orderStatusMatches(status, filter) {
  if (!filter || filter === "ALL") return true;
  return canonicalOrderStatus(status) === canonicalOrderStatus(filter);
}

export function rejectionText(order) {
  const reason = String(order?.rejectionReason || "").trim();
  const note = String(order?.rejectionNote || "").trim();
  if (!reason && !note) return "";
  return note ? `${reason}${reason ? " — " : ""}${note}` : reason;
}

export function matchesManagerOrderFilter(status, filter) {
  if (!filter || filter === "all") return true;
  return managerOrderBucket(status) === filter;
}

export function managerOrderBucket(status) {
  const s = canonicalOrderStatus(status);
  if (s === "NEW") return "pending";
  if (s === "REJECTED" || s === "CANCELLED") return "rejected";
  return "accepted";
}

export function toOrderDateKey(order) {
  const raw = order?.orderDate || order?.harvestDate || order?.date || order?.createdAt || "";
  const s = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function matchesOrderDateRange(order, from = "", to = "") {
  if (!from && !to) return true;
  const key = toOrderDateKey(order);
  if (!key) return false;
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

export function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function yesterdayISODate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const MANAGER_ORDER_STATUSES = [
  "NEW",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];
