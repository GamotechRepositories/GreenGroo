import jwt from "jsonwebtoken";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import StoreOrder from "../models/StoreOrder.js";
import { dispatchNextRider } from "../services/dispatchService.js";
import { getIO } from "../../../socket.js";
import {
  applyGigStatusChange,
  buildStatusResponseExtras,
  emitRiderDocumentUpdated,
  emitRiderStatusUpdated,
} from "../services/riderSocketService.js";

const normalizePhone = (phone) =>
  String(phone || "").replace(/\D/g, "").slice(-10);

const ALLOWED_STEPS = [
  "vehicle",
  "city",
  "area",
  "documents",
  "selfie",
  "liveness",
  "home",
];

const ALLOWED_LANGUAGES = ["en", "hi", "mr", "ta", "te", "kn"];
const ALLOWED_VEHICLES = [
  "motorcycle",
  "bicycle",
  "electric",
  "van",
  "no_vehicle",
];
const DOC_KEYS = ["aadhaar", "pan", "passport", "license", "rc", "insurance"];

const signToken = (deliveryBoy) => {
  if (!process.env.JWT_SECRET) {
    const err = new Error("JWT_SECRET is not configured on the server");
    err.statusCode = 500;
    throw err;
  }

  return jwt.sign(
    {
      id: deliveryBoy._id.toString(),
      role: "delivery_boy",
      phone: deliveryBoy.phone,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const authResponse = (deliveryBoy, token) => ({
  success: true,
  token,
  deliveryBoy: deliveryBoy.toSafeJSON(),
});

const applyDocumentMeta = (target, incoming) => {
  if (!incoming || typeof incoming !== "object") return;
  if (incoming.fileName !== undefined) target.fileName = String(incoming.fileName);
  if (incoming.localPath !== undefined) {
    target.localPath = String(incoming.localPath);
  }
  if (incoming.imageBase64 !== undefined) {
    const raw = String(incoming.imageBase64 || "");
    // Keep only reasonable data-URL payloads (manager preview).
    if (raw.startsWith("data:image/") && raw.length < 8_000_000) {
      target.imageBase64 = raw;
    } else if (raw === "") {
      target.imageBase64 = "";
    }
  }
  if (incoming.status !== undefined) target.status = String(incoming.status);
  target.capturedAt = incoming.capturedAt
    ? new Date(incoming.capturedAt)
    : new Date();
};

export const register = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");
    const name = String(req.body.name || "").trim();
    const language = String(req.body.language || "en").trim();

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

    const existing = await DeliveryBoy.findOne({ phone });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Delivery boy already registered with this phone number",
      });
    }

    const deliveryBoy = await DeliveryBoy.create({
      phone,
      password,
      name,
      language: ALLOWED_LANGUAGES.includes(language) ? language : "en",
    });

    const token = signToken(deliveryBoy);
    return res.status(201).json(authResponse(deliveryBoy, token));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");
    const language = String(req.body.language || "").trim();

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    const deliveryBoy = await DeliveryBoy.findOne({ phone }).select("+password");
    if (!deliveryBoy) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    if (!deliveryBoy.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact support.",
      });
    }

    const match = await deliveryBoy.comparePassword(password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    if (ALLOWED_LANGUAGES.includes(language)) {
      deliveryBoy.language = language;
      await deliveryBoy.save();
    }

    const token = signToken(deliveryBoy);
    return res.json(authResponse(deliveryBoy, token));
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.user.id);
    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found",
      });
    }

    return res.json({
      success: true,
      deliveryBoy: deliveryBoy.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const updateOnboarding = async (req, res, next) => {
  try {
    const body = req.body || {};
    const step = String(body.onboardingStep || "").trim();

    if (step && !ALLOWED_STEPS.includes(step)) {
      return res.status(400).json({
        success: false,
        message: "Invalid onboarding step",
      });
    }

    const deliveryBoy = await DeliveryBoy.findById(req.user.id);
    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found",
      });
    }

    if (step) deliveryBoy.onboardingStep = step;

    if (body.onboardingComplete !== undefined) {
      deliveryBoy.onboardingComplete = Boolean(body.onboardingComplete);
      if (deliveryBoy.onboardingComplete) {
        deliveryBoy.onboardingStep = "home";
        if (
          !deliveryBoy.verificationStatus ||
          deliveryBoy.verificationStatus === "pending"
        ) {
          deliveryBoy.verificationStatus = "pending";
        }
      }
    }

    if (body.language !== undefined) {
      const language = String(body.language).trim();
      if (ALLOWED_LANGUAGES.includes(language)) {
        deliveryBoy.language = language;
      }
    }

    if (body.city !== undefined) {
      deliveryBoy.city = String(body.city).trim();
    }

    if (body.cityId !== undefined) {
      deliveryBoy.cityId = String(body.cityId).trim();
    }

    if (body.area !== undefined) {
      deliveryBoy.area = String(body.area).trim();
    }

    if (body.vehicleType !== undefined) {
      const vehicleType = String(body.vehicleType).trim();
      if (ALLOWED_VEHICLES.includes(vehicleType)) {
        deliveryBoy.vehicleType = vehicleType;
      }
    }

    if (body.name !== undefined) {
      deliveryBoy.name = String(body.name).trim();
    }

    if (body.bankDetails && typeof body.bankDetails === "object") {
      const b = body.bankDetails;
      deliveryBoy.bankDetails = {
        accountHolderName: String(b.accountHolderName || "").trim(),
        accountNumber: String(b.accountNumber || "").trim(),
        ifscCode: String(b.ifscCode || "").trim(),
        bankName: String(b.bankName || "").trim(),
        upiId: String(b.upiId || "").trim(),
      };
    }

    if (body.documents && typeof body.documents === "object") {
      for (const key of DOC_KEYS) {
        if (body.documents[key]) {
          applyDocumentMeta(deliveryBoy.documents[key], body.documents[key]);
        }
      }
    }

    if (body.selfie) {
      applyDocumentMeta(deliveryBoy.selfie, body.selfie);
    }

    if (body.livenessPassed !== undefined) {
      deliveryBoy.livenessPassed = Boolean(body.livenessPassed);
    }

    await deliveryBoy.save();

    // Notify manager dashboard when documents/selfie are uploaded during onboarding
    for (const key of DOC_KEYS) {
      if (body.documents?.[key]?.status || body.documents?.[key]?.imageBase64) {
        await emitRiderDocumentUpdated(
          deliveryBoy,
          key,
          deliveryBoy.documents[key]?.status || "uploaded"
        );
      }
    }
    if (body.selfie?.status || body.selfie?.imageBase64) {
      await emitRiderDocumentUpdated(
        deliveryBoy,
        "selfie",
        deliveryBoy.selfie?.status || "uploaded"
      );
    }

    return res.json({
      success: true,
      deliveryBoy: deliveryBoy.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/** Immediate online/offline toggle — saved instantly in DB. */
export const updateStatus = async (req, res, next) => {
  try {
    const status = String(req.body.status || "").trim().toLowerCase();
    if (!["online", "offline"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "online" or "offline"',
      });
    }

    const existing = await DeliveryBoy.findById(req.user.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found",
      });
    }

    const verification = existing.verificationStatus || "pending";
    if (status === "online" && verification !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Verification pending. You can go online after manager approval (usually 3–6 hours).",
        deliveryBoy: existing.toSafeJSON(),
      });
    }

    try {
      await applyGigStatusChange(existing, status);
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message,
        deliveryBoy: existing.toSafeJSON(),
      });
    }

    await existing.save();
    const extras = await buildStatusResponseExtras(existing);
    await emitRiderStatusUpdated(existing, {
      todayOnlineMinutes: extras.todayOnlineMinutes,
    });

    if (status === "online") {
      // 1. Shift Booking Verification
      if (!existing.shiftBooking?.slot) {
        return res.status(400).json({
          success: false,
          code: "NO_SHIFT_BOOKED",
          message:
            "Mandatory: You must select and book a shift slot for today before going online!",
          deliveryBoy: existing.toSafeJSON(),
        });
      }

      // 2. Geofence Location Verification (Near Store in Pune)
      const lat = parseFloat(req.body.latitude || req.body.lat);
      const lng = parseFloat(req.body.longitude || req.body.lng);

      let manager = await DeliveryManager.findOne({
        isActive: true,
        $or: [
          { cityId: existing.cityId, area: existing.area },
          { city: existing.city, area: existing.area },
        ],
      });
      if (!manager) {
        manager = await DeliveryManager.findOne({ isActive: true }).sort({ createdAt: 1 });
      }

      const storeLat = manager?.latitude ?? 18.559;
      const storeLng = manager?.longitude ?? 73.7868;
      const allowedRadius = manager?.geofenceRadius ?? 1000; // 1 km radius for testing

      if (!isNaN(lat) && !isNaN(lng)) {
        const R = 6371e3; // meters
        const φ1 = (lat * Math.PI) / 180;
        const φ2 = (storeLat * Math.PI) / 180;
        const Δφ = ((storeLat - lat) * Math.PI) / 180;
        const Δλ = ((storeLng - lng) * Math.PI) / 180;
        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceMeters = R * c;

        if (distanceMeters > allowedRadius) {
          return res.status(400).json({
            success: false,
            code: "OUT_OF_GEOFENCE",
            message: `Location verification failed! You are ${Math.round(distanceMeters)}m away from store (${manager?.storeName || "Pune Store"}). Please reach near the store to start your shift.`,
            distanceMeters,
            deliveryBoy: existing.toSafeJSON(),
          });
        }
      }
    }

    return res.json({
      success: true,
      deliveryBoy: existing.toSafeJSON(),
      todayOnlineMinutes: extras.todayOnlineMinutes,
      isPeak: extras.isPeak,
      storeId: extras.storeId,
    });
  } catch (error) {
    next(error);
  }
};

/** Area delivery manager details for onboarding selection or offline verification visit. */
export const getAreaManager = async (req, res, next) => {
  try {
    const area = String(req.query.area || req.body?.area || "").trim();
    const cityId = String(req.query.cityId || req.body?.cityId || "").trim();

    let queryArea = area;
    let queryCityId = cityId;

    if (!queryArea && req.user?.id) {
      const deliveryBoy = await DeliveryBoy.findById(req.user.id);
      if (deliveryBoy) {
        queryArea = deliveryBoy.area;
        queryCityId = deliveryBoy.cityId;
      }
    }

    const queryFilter = queryArea
      ? {
          isActive: true,
          $or: [
            { area: { $regex: new RegExp(`^${queryArea}$`, "i") } },
            { cityId: queryCityId, area: queryArea },
          ],
        }
      : { isActive: true };

    let manager = await DeliveryManager.findOne(queryFilter).sort({ createdAt: 1 });
    if (!manager) {
      // Fallback: search any active manager
      manager = await DeliveryManager.findOne({ isActive: true }).sort({ createdAt: 1 });
    }

    if (!manager) {
      return res.json({
        success: true,
        manager: null,
        message: "No delivery manager registered for your area yet",
      });
    }

    return res.json({
      success: true,
      manager: {
        storeId: manager._id.toString(),
        name: manager.name || "Delivery Manager",
        phone: manager.phone || "9876500001",
        email: manager.email || "manager@greengroo.com",
        storeName: manager.storeName || `${manager.area || "Baner"} Dark Store`,
        storeAddress:
          manager.storeAddress ||
          `${manager.storeName || `${manager.area || "Baner"} Dark Store`}, ${manager.area || "Baner"}, ${manager.city || "Pune"}`,
        state: manager.state || "Maharashtra",
        city: manager.city || "Pune",
        area: manager.area || "Baner",
        darkStoreQrCode: `DARKSTORE_${manager._id}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Returns all active dark store hubs registered by delivery managers. */
export const getActiveHubs = async (req, res, next) => {
  try {
    const managers = await DeliveryManager.find({ isActive: true }).select(
      "state city cityId area storeName storeAddress latitude longitude"
    );

    const activeHubs = managers.map((m) => ({
      managerId: m._id.toString(),
      state: m.state || "Maharashtra",
      city: m.city || "Pune",
      cityId: m.cityId || (m.city ? m.city.toLowerCase().replace(/\s+/g, "-") : "pune"),
      area: m.area || "General",
      storeName: m.storeName || `${m.area} Dark Store`,
      storeAddress: m.storeAddress || "",
      latitude: m.latitude,
      longitude: m.longitude,
    }));

    return res.json({
      success: true,
      count: activeHubs.length,
      activeHubs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Heartbeat while online — keeps lastSeenAt fresh.
 * Call every ~30–60s from the app when status is online.
 */
export const heartbeat = async (req, res, next) => {
  try {
    const now = new Date();
    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          lastSeenAt: now,
          // If they send heartbeat, treat as still online
          status: "online",
        },
      },
      { new: true }
    );

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found",
      });
    }

    return res.json({
      success: true,
      deliveryBoy: deliveryBoy.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
