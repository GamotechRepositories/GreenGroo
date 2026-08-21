import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "greengroo-secret";

/**
 * Generic token verifier — attaches req.user
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized — token required" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized — invalid token" });
  }
}

/**
 * Allow only VENDOR role
 */
export function requireVendor(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "VENDOR") {
      return res.status(403).json({ message: "Forbidden — Vendor access required" });
    }
    next();
  });
}

/**
 * Allow only FARMER_MANAGER role
 */
export function requireManager(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "FARMER_MANAGER") {
      return res.status(403).json({ message: "Forbidden — Manager access required" });
    }
    next();
  });
}

/**
 * Allow only FARMER role
 */
export function requireFarmer(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "FARMER") {
      return res.status(403).json({ message: "Forbidden — Farmer access required" });
    }
    next();
  });
}

/**
 * Allow VENDOR or FARMER_MANAGER
 */
export function requireVendorOrManager(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "VENDOR" && req.user?.role !== "FARMER_MANAGER") {
      return res.status(403).json({ message: "Forbidden — Vendor or Manager access required" });
    }
    next();
  });
}

/**
 * Sign a JWT with the given payload
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
