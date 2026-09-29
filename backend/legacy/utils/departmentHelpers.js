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
