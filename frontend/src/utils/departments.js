/** Order departments, matching the backend (`departmentHelpers.js`). */
export const DEPARTMENT = {
  PREORDER: "preorder",
  READY2COOK: "ready2cook",
  INSTANT: "instant",
};

export const DEPARTMENT_ORDER = [DEPARTMENT.PREORDER, DEPARTMENT.READY2COOK, DEPARTMENT.INSTANT];

export const DEPARTMENT_META = {
  [DEPARTMENT.PREORDER]: { label: "Pre-order", icon: "📅", tone: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  [DEPARTMENT.READY2COOK]: { label: "Ready2Cook", icon: "🍲", tone: "border-orange-200 bg-orange-50 text-orange-800" },
  [DEPARTMENT.INSTANT]: { label: "Instant Order", icon: "⚡", tone: "border-violet-200 bg-violet-50 text-violet-800" },
};

export const FULFILLMENT = {
  DELIVERY: "delivery",
  PICKUP: "pickup",
};

export function departmentForItem(item = {}) {
  const section = item.section;
  const sec = String(
    (section && typeof section === "object" ? section.slug || section.name : section) || ""
  )
    .trim()
    .toLowerCase();
  const type = String(item.storeType || "").trim().toLowerCase();
  if (["ready2cook", "ready-2-cook", "festive"].includes(sec) || type === "festive") {
    return DEPARTMENT.READY2COOK;
  }
  if (["instantorder", "instant", "supermall", "mall", "instantorders"].includes(sec) || type === "mall") {
    return DEPARTMENT.INSTANT;
  }
  return DEPARTMENT.PREORDER;
}

/** Items grouped by department, in Pre-order → Ready2Cook → Instant order. */
export function groupItemsByDepartment(items = []) {
  const groups = new Map();
  for (const item of items) {
    const dept = departmentForItem(item);
    if (!groups.has(dept)) groups.set(dept, []);
    groups.get(dept).push(item);
  }
  return DEPARTMENT_ORDER.filter((dept) => groups.has(dept)).map((dept) => ({
    department: dept,
    items: groups.get(dept),
  }));
}

export function departmentEtaText(department, { pickup = false, preOrderSlot = "" } = {}) {
  if (department === DEPARTMENT.PREORDER) {
    const slot = String(preOrderSlot || "").trim();
    if (!slot) return "Tomorrow · choose a slot";
    return pickup ? `Pick up tomorrow, ${slot}` : `Delivered tomorrow, ${slot}`;
  }
  return pickup ? "Ready for pickup in 10–20 min" : "Delivered in 10–20 min";
}

/** Query for `/api/stores/nearest` built from a saved address. */
export function nearestStoreParams(address, { hasNowItems, fulfillment }) {
  const params = {
    section: hasNowItems ? "instantorder" : "preorder",
    fulfillment,
  };
  if (!address) return params;
  const lat = Number(address.location?.lat ?? address.lat);
  const lng = Number(address.location?.lng ?? address.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    params.lat = lat;
    params.lng = lng;
  }
  if (address.city) params.city = address.city;
  if (address.area) params.area = address.area;
  if (address.pincode) params.pincode = address.pincode;
  const text = [address.shopNo, address.fullAddress, address.landmark, address.area, address.city, address.state, address.pincode]
    .filter((part) => String(part || "").trim())
    .join(", ");
  if (text) params.address = text;
  return params;
}
