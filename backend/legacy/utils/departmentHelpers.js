export const DEPARTMENTS = {
  preorder: { key: "preorder", code: "PR", label: "Pre-order" },
  ready2cook: { key: "ready2cook", code: "RD", label: "Ready2Cook" },
  instant: { key: "instant", code: "IN", label: "Instant Order" },
};

export const DEPARTMENT_KEYS = Object.keys(DEPARTMENTS);

/** Map any product section / storeType alias to preorder | ready2cook | instant. */
export function sectionToDepartment(section, storeType = "") {
  const sec = String(section || "").trim().toLowerCase();
  const type = String(storeType || "").trim().toLowerCase();
  if (["ready2cook", "ready-2-cook", "festive"].includes(sec) || type === "festive") {
    return "ready2cook";
  }
  if (
    ["instantorder", "instant", "supermall", "mall", "instantorders"].includes(sec) ||
    type === "mall"
  ) {
    return "instant";
  }
  return "preorder";
}

export function departmentCode(department) {
  return DEPARTMENTS[department]?.code || DEPARTMENTS.preorder.code;
}

export function departmentLabel(department) {
  return DEPARTMENTS[department]?.label || DEPARTMENTS.preorder.label;
}

const cleanToken = (value, max = 12) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, max);

/**
 * Department-wise product id, e.g. "PR-28" or "RD-14-R2C3".
 * Number and row/column are optional; returns "" when no number is given.
 */
export function buildDepartmentId({ section, storeType, deptNumber, rackRow, rackColumn } = {}) {
  const number = cleanToken(deptNumber);
  if (!number) return "";
  const code = departmentCode(sectionToDepartment(section, storeType));
  const row = cleanToken(rackRow, 6).replace(/^R/, "");
  const column = cleanToken(rackColumn, 6).replace(/^C/, "");
  const location = row || column ? `-${row ? `R${row}` : ""}${column ? `C${column}` : ""}` : "";
  return `${code}-${number}${location}`;
}

export function normalizeDeptToken(value, max = 12) {
  return cleanToken(value, max);
}

/** "delivery" = rider brings it home; "pickup" = customer collects it from the dark store. */
export const FULFILLMENT_TYPES = ["delivery", "pickup"];

export function normalizeFulfillmentType(value) {
  return String(value || "").trim().toLowerCase() === "pickup" ? "pickup" : "delivery";
}

/** Unique, ordered list of departments present on a set of order items. */
export function collectDepartments(items = []) {
  const found = new Set(items.map((item) => item?.department).filter(Boolean));
  return DEPARTMENT_KEYS.filter((key) => found.has(key));
}

/** Customer-facing order types. Only ready_to_cook and instant get live rider tracking. */
export const ORDER_TYPES = ["ready_to_cook", "instant", "preorder"];
export const TRACKABLE_ORDER_TYPES = ["ready_to_cook", "instant"];

export function isTrackableOrderType(orderType) {
  return TRACKABLE_ORDER_TYPES.includes(orderType);
}

function typeFromLiveDepartments(departments = []) {
  if (departments.includes("instant")) return "instant";
  if (departments.includes("ready2cook")) return "ready_to_cook";
  return "instant";
}

/** Order type of a dark-store (split) order. */
export function deriveOrderType({ isPreOrder = false, sourcePart = "", departments = [] } = {}) {
  if (isPreOrder || sourcePart === "preorder") return "preorder";
  return typeFromLiveDepartments(departments || []);
}

/**
 * Order type of a customer order. A slot-booked cart made only of pre-order items is a
 * preorder; anything delivered now (instant / ready-to-cook items, or no slot at all) is live.
 */
export function deriveCustomerOrderType(order = {}) {
  const departments = order.departments?.length
    ? order.departments
    : collectDepartments(order.items || []);
  const liveDepartments = departments.filter((dept) => dept !== "preorder");
  if (order.preOrderSlot && !liveDepartments.length) return "preorder";
  return typeFromLiveDepartments(liveDepartments);
}
