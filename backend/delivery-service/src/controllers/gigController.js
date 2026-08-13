import DeliveryBoy from "../models/DeliveryBoy.js";
import {
  ensureTodayOnlineTracking,
  addOnlineMinutesSince,
  formatOnlineMinutes,
} from "../utils/onlineHoursHelper.js";

export const getLoginHours = async (req, res, next) => {
  try {
    const riderId = String(req.query.riderId || req.user.id);
    const dateStr =
      req.query.date || new Date().toISOString().slice(0, 10);

    if (req.user.role === "delivery_boy" && riderId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const rider = await DeliveryBoy.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    ensureTodayOnlineTracking(rider);

    let totalMinutes = rider.todayOnlineMinutes || 0;
    const today = new Date().toISOString().slice(0, 10);

    if (dateStr === today && rider.status === "online" && rider.lastOnlineAt) {
      totalMinutes += addOnlineMinutesSince(rider, rider.lastOnlineAt);
    }

    if (rider.todayOnlineDate !== dateStr && dateStr !== today) {
      totalMinutes = 0;
    }

    return res.json({
      success: true,
      riderId,
      date: dateStr,
      totalMinutes,
      formatted: formatOnlineMinutes(totalMinutes),
    });
  } catch (error) {
    next(error);
  }
};

export const getLiveRiders = async (req, res, next) => {
  try {
    const storeId = String(req.query.storeId || req.user.id);
    const DeliveryManager = (
      await import("../models/DeliveryManager.js")
    ).default;
    const { areaMatchForManager } = await import("../utils/storeResolver.js");

    const manager = await DeliveryManager.findById(storeId);
    if (!manager) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    const riders = await DeliveryBoy.find({
      $and: [areaMatchForManager(manager), { isActive: true }],
    }).select(
      "name phone status todayOnlineMinutes todayOnlineDate lastOnlineAt lastSeenAt shiftBooking area"
    );

    const today = new Date().toISOString().slice(0, 10);
    const payload = riders.map((r) => {
      ensureTodayOnlineTracking(r);
      let minutes = r.todayOnlineMinutes || 0;
      if (r.status === "online" && r.lastOnlineAt && r.todayOnlineDate === today) {
        minutes += addOnlineMinutesSince(r, r.lastOnlineAt);
      }
      return {
        riderId: r._id.toString(),
        name: r.name || r.phone,
        phone: r.phone,
        status: r.status,
        todayOnlineMinutes: minutes,
        todayOnlineFormatted: formatOnlineMinutes(minutes),
        lastSeenAt: r.lastSeenAt,
        shiftBooking: r.shiftBooking?.slot ? r.shiftBooking : null,
        area: r.area,
      };
    });

    return res.json({
      success: true,
      storeId,
      riders: payload,
    });
  } catch (error) {
    next(error);
  }
};
