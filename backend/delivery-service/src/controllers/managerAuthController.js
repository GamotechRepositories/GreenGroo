import jwt from "jsonwebtoken";
import DeliveryManager from "../models/DeliveryManager.js";
import { seedManagerStore } from "../services/seedManagerStore.js";

const normalizePhone = (phone) =>
  String(phone || "").replace(/\D/g, "").slice(-10);

const signToken = (manager) => {
  if (!process.env.JWT_SECRET) {
    const err = new Error("JWT_SECRET is not configured on the server");
    err.statusCode = 500;
    throw err;
  }

  return jwt.sign(
    {
      id: manager._id.toString(),
      role: "delivery_manager",
      email: manager.email,
      area: manager.area,
      cityId: manager.cityId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const authResponse = (manager, token) => ({
  success: true,
  token,
  manager: manager.toSafeJSON(),
});

const toCoord = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const citySlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function readStoreLocation(body = {}) {
  const latitude = toCoord(body.latitude ?? body.lat);
  const longitude = toCoord(body.longitude ?? body.lng);
  const state = String(body.state || "").trim();
  const city = String(body.city || "").trim();
  const area = String(body.area || "").trim();
  const storeAddress = String(body.storeAddress || body.address || "").trim();
  return { latitude, longitude, state, city, area, storeAddress };
}

function applyStoreLocation(manager, loc) {
  if (!manager || !loc) return false;
  let changed = false;
  if (loc.latitude != null && loc.longitude != null) {
    manager.latitude = loc.latitude;
    manager.longitude = loc.longitude;
    changed = true;
  }
  if (loc.state) {
    manager.state = loc.state;
    changed = true;
  }
  if (loc.city) {
    manager.city = loc.city;
    manager.cityId = citySlug(loc.city);
    changed = true;
  }
  if (loc.area) {
    manager.area = loc.area;
    changed = true;
  }
  if (loc.storeAddress) {
    manager.storeAddress = loc.storeAddress;
    changed = true;
  }
  return changed;
}

export const register = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");
    const name = String(req.body.name || "").trim();
    const state = String(req.body.state || "").trim();
    const city = String(req.body.city || "").trim();
    const cityId = String(req.body.cityId || "").trim().toLowerCase();
    const area = String(req.body.area || "").trim();
    const storeName = String(req.body.storeName || "").trim();
    const loc = readStoreLocation(req.body);
    const storeAddress = loc.storeAddress;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!state || !city || !area) {
      return res.status(400).json({
        success: false,
        message: "State, city and area are required",
      });
    }

    const existingEmail = await DeliveryManager.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const existingPhone = await DeliveryManager.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    const manager = await DeliveryManager.create({
      name,
      email,
      phone,
      password,
      state,
      city,
      cityId: cityId || citySlug(city),
      area,
      storeName: storeName || `${area} Store`,
      storeAddress:
        storeAddress ||
        `${storeName || `${area} Store`}, ${area}, ${city}, ${state}`,
      latitude: loc.latitude ?? undefined,
      longitude: loc.longitude ?? undefined,
    });

    const seeded = await seedManagerStore(manager);

    const token = signToken(manager);
    return res.status(201).json({
      ...authResponse(manager, token),
      seeded,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or phone and password are required",
      });
    }

    const query = email ? { email } : { phone };
    const manager = await DeliveryManager.findOne(query).select("+password");

    if (!manager || !(await manager.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!manager.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Bind this dark store to the manager's current GPS so nearby orders route here.
    const loc = readStoreLocation(req.body);
    if (applyStoreLocation(manager, loc)) {
      await DeliveryManager.updateOne(
        { _id: manager._id },
        {
          $set: {
            latitude: manager.latitude,
            longitude: manager.longitude,
            state: manager.state,
            city: manager.city,
            cityId: manager.cityId,
            area: manager.area,
            storeAddress: manager.storeAddress,
          },
        }
      );
    }

    // Ensure store has inventory (e.g. older accounts)
    await seedManagerStore(manager);

    const token = signToken(manager);
    return res.json(authResponse(manager, token));
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const manager = await DeliveryManager.findById(req.user.id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Delivery manager not found",
      });
    }
    return res.json({ success: true, manager: manager.toSafeJSON() });
  } catch (error) {
    next(error);
  }
};
