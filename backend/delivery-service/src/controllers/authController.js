import jwt from "jsonwebtoken";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import StoreOrder from "../models/StoreOrder.js";
import Shift from "../models/Shift.js";
import { dispatchNextRider } from "../services/dispatchService.js";
import { getIO } from "../../../socket.js";
import {
  applyGigStatusChange,
  buildStatusResponseExtras,
  emitRiderDocumentUpdated,
  emitRiderStatusUpdated,
} from "../services/riderSocketService.js";
import { isS3Configured, uploadDataUrlToS3 } from "../services/s3Service.js";
import { areaMatches, placesEqual } from "../utils/matchPlace.js";
import { findLiveGigForManager } from "./gigManagementController.js";

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

const applyDocumentMeta = async (target, incoming, folder = "delivery-boys/documents") => {
  if (!incoming || typeof incoming !== "object") return;

  const imageBase64 = String(incoming.imageBase64 || "");

  if (incoming.url !== undefined) {
    target.url = String(incoming.url);
  }

  // Upload to AWS S3 if S3 is configured and imageBase64 is provided
  if (isS3Configured() && imageBase64.startsWith("data:image/")) {
    try {
      const s3Res = await uploadDataUrlToS3(imageBase64, folder);
      if (s3Res && s3Res.url) {
        target.url = s3Res.url;
      }
    } catch (err) {
      console.error("[AWS S3 Upload Error]", err);
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

    const existing = await DeliveryBoy.findOne({ phone }).select("+password");
    if (existing) {
      const match = await existing.comparePassword(password).catch(() => false);
      if (match) {
        const token = signToken(existing);
        return res.status(200).json(authResponse(existing, token));
      }
      return res.status(409).json({
        success: false,
        code: "ACCOUNT_EXISTS",
        message: "Account already exists with this phone number. Please login with your password.",
      });
    }

    const city = String(req.body.city || "").trim();
    const cityId = String(req.body.cityId || "").trim();
    const area = String(req.body.area || "").trim();
    const managerId = req.body.managerId || req.body.storeId;

    let targetManagerId = managerId || null;
    let targetStoreId = managerId ? String(managerId) : "";

    if (!targetManagerId && (area || cityId || city)) {
      const escapedArea = area.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const mgr = await DeliveryManager.findOne({
        isActive: true,
        $or: [
          ...(escapedArea ? [{ area: { $regex: new RegExp(`^${escapedArea}$`, "i") } }] : []),
          { cityId, area },
          { city, area },
        ],
      }).sort({ createdAt: -1 });

      if (mgr) {
        targetManagerId = mgr._id;
        targetStoreId = mgr._id.toString();
      }
    }

    const deliveryBoy = await DeliveryBoy.create({
      phone,
      password,
      name,
      language: ALLOWED_LANGUAGES.includes(language) ? language : "en",
      city,
      cityId,
      area,
      managerId: targetManagerId,
      storeId: targetStoreId,
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

export const ackSlotAlerts = async (req, res, next) => {
  try {
    await DeliveryBoy.updateOne(
      { _id: req.user.id },
      { $set: { pendingSlotAlerts: [] } }
    );
    return res.json({ success: true });
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

    if (body.managerId) {
      deliveryBoy.managerId = body.managerId;
      deliveryBoy.storeId = body.managerId.toString();
    } else if (deliveryBoy.area || deliveryBoy.cityId || deliveryBoy.city) {
      const escapedArea = (deliveryBoy.area || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const mgr = await DeliveryManager.findOne({
        isActive: true,
        $or: [
          ...(escapedArea ? [{ area: { $regex: new RegExp(`^${escapedArea}$`, "i") } }] : []),
          { cityId: deliveryBoy.cityId, area: deliveryBoy.area },
          { city: deliveryBoy.city, area: deliveryBoy.area },
        ],
      }).sort({ createdAt: -1 });

      if (mgr) {
        deliveryBoy.managerId = mgr._id;
        deliveryBoy.storeId = mgr._id.toString();
      } else {
        deliveryBoy.managerId = null;
        deliveryBoy.storeId = "";
      }
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
          await applyDocumentMeta(
            deliveryBoy.documents[key],
            body.documents[key],
            `delivery-boys/documents/${key}`
          );
        }
      }
      deliveryBoy.markModified("documents");
    }

    if (body.selfie) {
      await applyDocumentMeta(
        deliveryBoy.selfie,
        body.selfie,
        "delivery-boys/selfies"
      );
      deliveryBoy.markModified("selfie");
    }

    if (body.livenessPassed !== undefined) {
      deliveryBoy.livenessPassed = Boolean(body.livenessPassed);
      if (deliveryBoy.livenessPassed) {
        deliveryBoy.livenessPassedAt = body.livenessPassedAt
          ? new Date(body.livenessPassedAt)
          : new Date();
      }
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
      // 1. Shift booking is required unless a store gig is live right now.
      if (!existing.currentBooking?.shiftId) {
        const escapedRiderArea = (existing.area || "")
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const gigManager = await DeliveryManager.findOne({
          isActive: true,
          $or: [
            ...(escapedRiderArea
              ? [{ area: { $regex: new RegExp(`^${escapedRiderArea}$`, "i") } }]
              : []),
            { cityId: existing.cityId, area: existing.area },
            { city: existing.city, area: existing.area },
          ],
        });
        const liveGig = gigManager
          ? await findLiveGigForManager(gigManager._id)
          : null;
        if (!liveGig) {
          return res.status(400).json({
            success: false,
            code: "NO_SHIFT_BOOKED",
            message:
              "Mandatory: You must select and book a shift slot for today before going online!",
            deliveryBoy: existing.toSafeJSON(),
          });
        }
      }

      // 2. Geofence Location Verification (Near Store in Pune)
      const lat = parseFloat(req.body.latitude || req.body.lat);
      const lng = parseFloat(req.body.longitude || req.body.lng);

      const escapedRiderArea = (existing.area || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let manager = await DeliveryManager.findOne({
        isActive: true,
        $or: [
          ...(escapedRiderArea ? [{ area: { $regex: new RegExp(`^${escapedRiderArea}$`, "i") } }] : []),
          { cityId: existing.cityId, area: existing.area },
          { city: existing.city, area: existing.area },
        ],
      });

      let storeLat = manager?.latitude ?? 18.559;
      let storeLng = manager?.longitude ?? 73.7868;
      let allowedRadius = manager?.geofenceRadius ?? 1000;

      const isSameArea =
        existing.area &&
        manager?.area &&
        existing.area.trim().toLowerCase() === manager.area.trim().toLowerCase();

      const isDefaultStoreCoords =
        Math.abs(storeLat - 18.559) < 0.001 && Math.abs(storeLng - 73.7868) < 0.001;

      if (isSameArea && isDefaultStoreCoords && !isNaN(lat) && !isNaN(lng)) {
        manager.latitude = lat;
        manager.longitude = lng;
        await manager.save().catch(() => {});
        storeLat = lat;
        storeLng = lng;
      }

      if (isSameArea) {
        allowedRadius = Math.max(allowedRadius, 15000);
      }

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

function toManagerPayload(manager) {
  return {
    storeId: manager._id.toString(),
    name: manager.name || "Delivery Manager",
    phone: manager.phone || "",
    email: manager.email || "",
    storeName: manager.storeName || `${manager.area || "Area"} Dark Store`,
    storeAddress:
      manager.storeAddress ||
      `${manager.storeName || `${manager.area} Dark Store`}, ${manager.area}, ${manager.city}`,
    state: manager.state || "",
    city: manager.city || "",
    area: manager.area || "",
    pincode: manager.pincode || "",
    darkStoreQrCode: `DARKSTORE_${manager._id}`,
  };
}

/** Area delivery manager details for onboarding selection or offline verification visit. */
export const getAreaManager = async (req, res, next) => {
  try {
    const area = String(req.query.area || req.body?.area || "").trim();
    const cityId = String(req.query.cityId || req.body?.cityId || "").trim();
    const city = String(req.query.city || req.body?.city || "").trim();

    let queryArea = area;
    let queryCityId = cityId;
    let queryCity = city;

    if (!queryArea && req.user?.id) {
      const deliveryBoy = await DeliveryBoy.findById(req.user.id);
      if (deliveryBoy) {
        queryArea = deliveryBoy.area;
        queryCityId = deliveryBoy.cityId;
        queryCity = deliveryBoy.city || queryCity;
      }
    }

    if (!queryArea) {
      return res.json({
        success: true,
        manager: null,
        managers: [],
        message: "No area specified",
      });
    }

    const all = await DeliveryManager.find({ isActive: true }).lean();
    const sameCity = (m) => {
      if (queryCityId && placesEqual(m.cityId, queryCityId)) return true;
      if (queryCity && placesEqual(m.city, queryCity)) return true;
      return !queryCityId && !queryCity;
    };
    const matched = all.filter(
      (m) => areaMatches(m.area, queryArea) && sameCity(m)
    );

    matched.sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );

    if (!matched.length) {
      return res.json({
        success: true,
        manager: null,
        managers: [],
        message: "No darkstore registered",
      });
    }

    const managers = matched.map(toManagerPayload);
    return res.json({
      success: true,
      manager: managers[0],
      managers,
      count: managers.length,
    });
  } catch (error) {
    next(error);
  }
};

/** Returns all active dark store hubs registered by delivery managers. */
export const getActiveHubs = async (req, res, next) => {
  try {
    const managers = await DeliveryManager.find({ isActive: true }).select(
      "state city cityId area storeName storeAddress latitude longitude pincode"
    );

    const activeHubs = managers.map((m) => ({
      managerId: m._id.toString(),
      state: m.state || "Maharashtra",
      city: m.city || "Pune",
      cityId: m.cityId || (m.city ? m.city.toLowerCase().replace(/\s+/g, "-") : "pune"),
      area: m.area || "General",
      storeName: m.storeName || `${m.area} Dark Store`,
      storeAddress: m.storeAddress || "",
      pincode: m.pincode || "",
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
 * Heartbeat while online — keeps lastSeenAt, location, and fcmToken fresh.
 * Call every ~30–60s from the app when status is online.
 */
export const heartbeat = async (req, res, next) => {
  try {
    const now = new Date();
    const updates = {
      lastSeenAt: now,
      status: "online",
    };

    if (req.body.fcmToken !== undefined) {
      updates.fcmToken = String(req.body.fcmToken).trim();
    }

    const lat = Number(req.body.lat ?? req.body.latitude);
    const lng = Number(req.body.lng ?? req.body.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      updates.currentLocation = { lat, lng, updatedAt: now };
    }

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
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

/** Updates FCM registration token for push notifications */
export const updateFcmToken = async (req, res, next) => {
  try {
    const fcmToken = String(req.body.fcmToken || "").trim();
    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.user.id,
      { $set: { fcmToken } },
      { new: true }
    );
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: "Delivery boy not found" });
    }
    return res.json({
      success: true,
      message: "FCM token updated successfully",
      fcmToken: deliveryBoy.fcmToken,
    });
  } catch (error) {
    next(error);
  }
};

/** Updates live GPS coordinates of rider */
export const updateLocation = async (req, res, next) => {
  try {
    const lat = Number(req.body.lat ?? req.body.latitude);
    const lng = Number(req.body.lng ?? req.body.longitude);
    const now = new Date();

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: "Valid lat and lng are required" });
    }

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          currentLocation: { lat, lng, updatedAt: now },
          lastSeenAt: now,
        },
      },
      { new: true }
    );

    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: "Delivery boy not found" });
    }

    try {
      if (deliveryBoy.managerId) {
        getIO().to(`store_${deliveryBoy.managerId}`).emit("rider_location_updated", {
          riderId: deliveryBoy._id.toString(),
          location: { lat, lng, updatedAt: now.toISOString() },
        });
      }
    } catch (err) {}

    return res.json({
      success: true,
      currentLocation: deliveryBoy.toSafeJSON().currentLocation,
    });
  } catch (error) {
    next(error);
  }
};

/** Updates rating and total ratings count for rider */
export const updateRiderRating = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const newRating = Number(req.body.rating);

    if (isNaN(newRating) || newRating < 1 || newRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const rider = await DeliveryBoy.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    const currentCount = rider.totalRatingsCount || 0;
    const currentRating = rider.rating !== undefined ? rider.rating : 5;
    const newCount = currentCount + 1;
    const updatedRating = Math.round(((currentRating * currentCount + newRating) / newCount) * 10) / 10;

    rider.rating = updatedRating;
    rider.totalRatingsCount = newCount;
    await rider.save();

    return res.json({
      success: true,
      riderId: rider._id.toString(),
      rating: rider.rating,
      totalRatingsCount: rider.totalRatingsCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /home/progress (or GET /home-dashboard)
 * Returns logged-in delivery partner's Today's Progress metrics.
 */
export const getTodayProgress = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const rider = await DeliveryBoy.findById(riderId);

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    // Today's date in Indian Standard Time (IST, UTC+5:30)
    const todayISTDateString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Reset daily counters if date has changed in IST
    if (rider.todayOnlineDate !== todayISTDateString) {
      rider.todayEarnings = 0;
      rider.todayCompletedOrders = 0;
      rider.todayOrderCount = 0;
      rider.todayOnlineMinutes = 0;
      rider.todayOnlineDate = todayISTDateString;
      await rider.save();
    }

    // Check if rider has any active booking pointer on the rider model itself
    const hasRiderBookingPointer = Boolean(
      (rider.currentBooking && rider.currentBooking.shiftId) ||
      (rider.shiftBooking && rider.shiftBooking.bookingId)
    );

    // Query all Shift documents where this rider is booked
    const riderIdStr = rider._id.toString();
    const riderPhone = (rider.phone || "").trim();

    const shiftsFound = await Shift.find({
      $or: [
        { "slots.bookings.deliveryPartnerId": rider._id },
        { "slots.bookings.deliveryPartnerPhone": riderPhone },
        ...(rider.currentBooking?.shiftId ? [{ _id: rider.currentBooking.shiftId }] : []),
      ],
    });

    let bookedShiftsCount = 0;
    let completedShiftsCount = 0;

    for (const shift of shiftsFound) {
      for (const slot of shift.slots || []) {
        for (const booking of slot.bookings || []) {
          const bRiderId = booking.deliveryPartnerId ? booking.deliveryPartnerId.toString() : "";
          const bRiderPhone = (booking.deliveryPartnerPhone || "").trim();

          const isRiderMatch =
            bRiderId === riderIdStr ||
            (riderPhone && bRiderPhone === riderPhone) ||
            (rider.currentBooking?.bookingId && booking._id?.toString() === rider.currentBooking.bookingId.toString()) ||
            (rider.shiftBooking?.bookingId && booking.bookingId === rider.shiftBooking.bookingId);

          if (isRiderMatch) {
            if (booking.status !== "CANCELLED") {
              bookedShiftsCount++;
            }
            if (booking.status === "COMPLETED") {
              completedShiftsCount++;
            }
          }
        }
      }
    }

    // Direct fallback: If rider has an active booking on rider model or in DB, ensure bookedShiftsCount >= 1
    if (bookedShiftsCount === 0 && (hasRiderBookingPointer || shiftsFound.length > 0)) {
      bookedShiftsCount = 1;
    }

    const todayEarnings = Math.max(0, Number(rider.todayEarnings || 0));
    const completedTrips = Math.max(
      0,
      Number(rider.todayCompletedOrders || rider.todayOrderCount || 0)
    );
    const onlineMinutes = Math.max(0, Number(rider.todayOnlineMinutes || 0));

    const hours = Math.floor(onlineMinutes / 60);
    const mins = onlineMinutes % 60;
    const onlineTime = `${hours}h ${mins}m`;

    return res.json({
      success: true,
      data: {
        todayEarnings,
        completedTrips,
        onlineMinutes,
        onlineTime,
        bookedShifts: bookedShiftsCount,
        shiftsBooked: bookedShiftsCount,
        bookedShiftsCount: bookedShiftsCount,
        completedShifts: completedShiftsCount,
        completedShiftsCount: completedShiftsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

