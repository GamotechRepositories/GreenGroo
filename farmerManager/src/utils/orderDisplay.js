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

export const ORDER_STATUS_ALIASES = {
  NEW: "NEW",
  New: "NEW",
  Confirmed: "NEW",
  Approved: "NEW",
  Pending: "NEW",
  ACCEPTED: "ACCEPTED",
  Accepted: "ACCEPTED",
  PREPARING: "PREPARING",
  Preparing: "PREPARING",
  Processing: "PREPARING",
  PACKING: "PACKING",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  "Ready for Pickup": "READY_FOR_PICKUP",
  PICKUP_SCHEDULED: "PICKUP_SCHEDULED",
  DRIVER_ASSIGNED: "DRIVER_ASSIGNED",
  DRIVER_ARRIVED: "DRIVER_ARRIVED",
  ORDER_VERIFIED: "ORDER_VERIFIED",
  QR_VERIFIED: "QR_VERIFIED",
  DISPATCHED: "DISPATCHED",
  IN_TRANSIT: "IN_TRANSIT",
  PICKUP_CONFIRMED: "PICKUP_CONFIRMED",
  PICKED_UP: "PICKED_UP",
  ARRIVED_AT_CENTRE: "ARRIVED_AT_CENTRE",
  COLLECTION_CENTRE_RECEIVED: "COLLECTION_CENTRE_RECEIVED",
  RECEIVED_AT_COLLECTION_CENTRE: "COLLECTION_CENTRE_RECEIVED",
  QUALITY_PENDING: "QUALITY_PENDING",
  INSPECTION: "INSPECTION",
  GRADING: "GRADING",
  GRADE_CONFIRMED: "GRADE_CONFIRMED",
  ORDER_COMPLETED: "ORDER_COMPLETED",
  COMPLETED: "COMPLETED",
  Completed: "COMPLETED",
  REJECTED: "REJECTED",
  Rejected: "REJECTED",
  CANCELLED: "CANCELLED",
  Cancelled: "CANCELLED",
};

export const ORDER_FILTERS = {
  new: ["NEW"],
  preparing: ["ACCEPTED", "PREPARING", "PACKING"],
  ready: [
    "READY_FOR_PICKUP",
    "PICKUP_SCHEDULED",
    "DRIVER_ASSIGNED",
    "DISPATCHED",
    "DRIVER_ARRIVED",
    "ORDER_VERIFIED",
    "QR_VERIFIED",
  ],
  completed: [
    "PICKUP_CONFIRMED",
    "PICKED_UP",
    "COMPLETED",
    "IN_TRANSIT",
    "ARRIVED_AT_CENTRE",
    "COLLECTION_CENTRE_RECEIVED",
    "RECEIVED_AT_COLLECTION_CENTRE",
    "QUALITY_PENDING",
    "INSPECTION",
    "GRADING",
    "GRADE_CONFIRMED",
    "ORDER_COMPLETED",
  ],
  rejected: ["REJECTED"],
};

export function isOrderDeleted(o) {
  if (!o) return true;
  if (o.isDeleted === true || o.deleted === true) return true;
  const s = String(o.status || "").trim().toUpperCase();
  return s === "DELETED" || s === "CANCELLED" || s === "CANCELED" || s === "DELETED_ORDER";
}

export function getOrderStage(status) {
  const norm = ORDER_STATUS_ALIASES[status] || status || "NEW";
  for (const [stage, list] of Object.entries(ORDER_FILTERS)) {
    if (list.includes(norm)) return stage;
  }
  return "preparing";
}

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
  if (!raw) return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
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

export function isOrderInTimeRange(order, timeRange) {
  if (!order || timeRange === "all") return true;
  const orderDateKey = toOrderDateKey(order);
  if (!orderDateKey) return true;

  const today = todayISODate();
  const yesterday = yesterdayISODate();

  if (timeRange === "today") return orderDateKey === today;
  if (timeRange === "yesterday") return orderDateKey === yesterday;

  const days = Number(timeRange) || 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const startDateKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;

  return orderDateKey >= startDateKey && orderDateKey <= today;
}

export const MANAGER_ORDER_STATUSES = [
  "NEW",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];
