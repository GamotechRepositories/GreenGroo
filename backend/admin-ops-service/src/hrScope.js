import { FarmerManager, PickupDriver } from "../../farmer-manager-service/src/models.js";

/** Roles a vendor (collection centre) can manage in its own HR module. */
export const VENDOR_HR_ROLE_KEYS = ["farmer_manager", "pickup_driver"];

const ADMIN_OWNED = { $in: ["", null] };

export function attachVendorHrScope(req, res, next) {
  const vendorId = String(req.user?.vendorId || req.user?.id || "").trim();
  if (!vendorId) return res.status(403).json({ success: false, message: "Vendor account required" });
  req.hrScope = { vendorId };
  next();
}

export const isVendorScope = (req) => Boolean(req.hrScope);
export const hrOwnerId = (req) => req.hrScope?.vendorId || "";

/** Owner filter for HR records that carry a vendorId (announcements, meetings, vacancies, candidates). */
export const hrOwnerFilter = (req) => ({ vendorId: req.hrScope ? req.hrScope.vendorId : ADMIN_OWNED });

export const ownsHrRecord = (req, row) =>
  String(row?.vendorId || "") === (req.hrScope ? req.hrScope.vendorId : "");

/** Live feeds for role apps: admin rows for everyone, vendor rows only for that vendor's team. */
export function liveHrOwnerFilter(user) {
  const role = String(user?.role || "").toUpperCase();
  const vendorId = String(user?.vendorId || "").trim();
  if (!vendorId || role === "VENDOR") return { vendorId: ADMIN_OWNED };
  return { vendorId: { $in: ["", null, vendorId] } };
}

export function scopedRoles(req, roles) {
  if (!req.hrScope) return roles;
  return roles.filter((role) => role.value === "all" || VENDOR_HR_ROLE_KEYS.includes(role.value));
}

export function allowedHrRole(req, roleKey, { allowAll = false } = {}) {
  if (!req.hrScope) return true;
  if (allowAll && roleKey === "all") return true;
  return VENDOR_HR_ROLE_KEYS.includes(roleKey);
}

async function scopeEmployees(req) {
  if (!req.hrScope) return null;
  if (!req.hrScope.employees) {
    const { vendorId } = req.hrScope;
    const [managers, drivers] = await Promise.all([
      FarmerManager.find({ vendorId }).select("id").lean(),
      PickupDriver.find({ vendorId }).select("id").lean(),
    ]);
    const toId = (row) => String(row.id || row._id);
    req.hrScope.employees = {
      farmer_manager: managers.map(toId),
      pickup_driver: drivers.map(toId),
    };
  }
  return req.hrScope.employees;
}

/** Mongo filter limiting employee-keyed HR rows to the vendor's team (null for admin). */
export async function hrEmployeeFilter(req) {
  const employees = await scopeEmployees(req);
  if (!employees) return null;
  return {
    $or: Object.entries(employees).map(([employeeType, ids]) => ({ employeeType, employeeId: { $in: ids } })),
  };
}

export const withHrScope = (filter, scopeFilter) => (scopeFilter ? { $and: [filter, scopeFilter] } : filter);

export async function canManageHrEmployee(req, employeeType, employeeId) {
  const employees = await scopeEmployees(req);
  if (!employees) return true;
  return (employees[String(employeeType || "")] || []).includes(String(employeeId || ""));
}
