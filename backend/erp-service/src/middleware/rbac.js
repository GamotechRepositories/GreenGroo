import { protect } from "@greengrocc/shared";

const ROLE_MAP = {
  admin: "ADMIN",
  superadmin: "ADMIN",
  CEO: "CEO",
  ADMIN: "ADMIN",
  VENDOR: "VENDOR",
  FARMER_MANAGER: "FARMER_MANAGER",
  FARMER: "FARMER",
  DRIVER: "DRIVER",
  HR: "HR",
  FINANCE: "FINANCE",
  QUALITY_INSPECTOR: "QUALITY_INSPECTOR",
  CUSTOMER_SERVICE: "CUSTOMER_SERVICE",
  COLLECTION_CENTRE_STAFF: "COLLECTION_CENTRE_STAFF",
  WAREHOUSE_STAFF: "WAREHOUSE_STAFF",
  MANAGER: "FARMER_MANAGER",
};

export function normalizeRole(role) {
  if (!role) return null;
  return ROLE_MAP[role] || String(role).toUpperCase();
}

export const ROLE_PERMISSIONS = {
  CEO: ["erp:read"],
  ADMIN: ["erp:read", "erp:write", "erp:admin"],
  VENDOR: ["erp:read", "erp:write"],
  FARMER_MANAGER: ["erp:read", "erp:write"],
  FARMER: ["erp:read"],
  COLLECTION_CENTRE_STAFF: ["erp:read", "erp:write"],
  WAREHOUSE_STAFF: ["erp:read", "erp:write"],
  DRIVER: ["erp:read"],
  HR: ["erp:read", "erp:write"],
  FINANCE: ["erp:read", "erp:write"],
  QUALITY_INSPECTOR: ["erp:read", "erp:write"],
  CUSTOMER_SERVICE: ["erp:read", "erp:write"],
};

export function requireErpAuth(req, res, next) {
  return protect(req, res, () => {
    req.erpRole = normalizeRole(req.user?.role);
    if (!req.erpRole) {
      return res.status(403).json({ success: false, message: "ERP role required" });
    }
    next();
  });
}

export function requirePermission(...perms) {
  return (req, res, next) => {
    const granted = ROLE_PERMISSIONS[req.erpRole] || [];
    const ok = perms.every((p) => granted.includes(p) || granted.includes("erp:admin"));
    if (!ok) {
      return res.status(403).json({ success: false, message: "You do not have permission for this ERP action" });
    }
    next();
  };
}

const hits = new Map();

export function erpRateLimit(windowMs = 60000, max = 120) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.user?.id || "anon"}`;
    const now = Date.now();
    const row = hits.get(key) || { count: 0, start: now };
    if (now - row.start > windowMs) {
      row.count = 0;
      row.start = now;
    }
    row.count += 1;
    hits.set(key, row);
    if (row.count > max) {
      return res.status(429).json({ success: false, message: "Too many ERP requests" });
    }
    next();
  };
}
