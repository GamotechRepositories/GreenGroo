import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const jwtSecret = () => process.env.JWT_SECRET || "greengroo-secret";

export function extractToken(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.toLowerCase().startsWith("bearer ") ? raw.slice(7).trim() : raw;
}

export function verifyToken(token) {
  const clean = extractToken(token);
  if (!clean) return null;
  try {
    return jwt.verify(clean, jwtSecret());
  } catch {
    return null;
  }
}

async function roleFromUserCollections(id) {
  if (!id || !mongoose.isValidObjectId(id) || !mongoose.connection?.db) return null;
  const _id = new mongoose.Types.ObjectId(String(id));
  try {
    const user = await mongoose.connection.db
      .collection("users")
      .findOne({ _id }, { projection: { role: 1 } });
    if (user) return String(user.role || "user").toLowerCase();
    const admin = await mongoose.connection.db
      .collection("admins")
      .findOne({ _id }, { projection: { _id: 1 } });
    if (admin) return "admin";
  } catch {
    return null;
  }
  return null;
}

function roomsFor(role, decoded, id) {
  const rooms = new Set();
  const add = (...names) => names.filter(Boolean).forEach((name) => rooms.add(name));

  switch (role) {
    case "admin":
      add("role:admin", `user:${id}`);
      break;
    case "delivery_manager":
      add("role:delivery_manager", `store:${id}`, `store_${id}`);
      break;
    case "delivery_boy":
      add(`rider:${id}`, `rider_${id}`);
      break;
    case "farmer": {
      const farmerIds = [decoded.farmerId, decoded.id].filter(Boolean).map(String);
      farmerIds.forEach((fid) => add(`farmer:${fid}`, `farmer_${fid}`));
      break;
    }
    case "farmer_manager": {
      const managerId = String(decoded.managerId || decoded.id || "");
      if (managerId) add(`farmer_manager:${managerId}`, `manager_${managerId}`);
      break;
    }
    case "vendor": {
      const vendorId = String(decoded.vendorId || decoded.id || "");
      add("role:vendor");
      if (vendorId) add(`vendor:${vendorId}`, `vendor_${vendorId}`);
      break;
    }
    case "driver": {
      const driverId = String(decoded.driverId || decoded.id || "");
      if (driverId) add(`driver:${driverId}`, `driver_${driverId}`);
      break;
    }
    case "user":
    case "customer":
      add(`user:${id}`);
      break;
    default:
      if (role) add(`role:${role}`, `staff:${id}`);
      else if (id) add(`user:${id}`);
  }
  return [...rooms];
}

/**
 * Resolve a JWT into `{ role, id, rooms }`. Tokens without a role claim are
 * customer/admin tokens; their role is looked up in `users` / `admins`.
 */
export async function identityFromToken(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const id = String(decoded.id || decoded.vendorId || decoded.driverId || decoded.managerId || "");
  let role = decoded.role ? String(decoded.role).trim().toLowerCase() : "";
  if (!role) role = (await roleFromUserCollections(id)) || "user";
  return {
    id,
    role,
    rooms: roomsFor(role, decoded, id),
    claims: decoded,
    expiresAt: decoded.exp ? decoded.exp * 1000 : null,
  };
}
