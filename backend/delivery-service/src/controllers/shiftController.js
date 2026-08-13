import { getIO } from "../../../socket.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import {
  SHIFT_SLOTS,
  VALID_SHIFT_SLOTS,
  findShiftSlot,
} from "../data/shiftSlots.js";
import { resolveStoreIdForRider, areaMatchForManager } from "../utils/storeResolver.js";

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const listShifts = async (_req, res) => {
  return res.json({ success: true, shifts: SHIFT_SLOTS });
};

export const bookShift = async (req, res, next) => {
  try {
    const slot = String(req.body.slot || "").trim();
    const dateInput = req.body.date;
    const cancel = Boolean(req.body.cancel);

    const rider = await DeliveryBoy.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    if (cancel) {
      rider.shiftBooking = { slot: "", date: null, bookedAt: null };
      await rider.save();
      return res.json({
        success: true,
        message: "Shift booking cancelled",
        shiftBooking: null,
        deliveryBoy: rider.toSafeJSON(),
      });
    }

    if (!VALID_SHIFT_SLOTS.has(slot)) {
      return res.status(400).json({ success: false, message: "Invalid shift slot" });
    }

    if (!dateInput) {
      return res.status(400).json({ success: false, message: "date is required" });
    }

    const date = startOfDay(new Date(dateInput));
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date" });
    }

    rider.shiftBooking = {
      slot,
      date,
      bookedAt: new Date(),
    };
    await rider.save();

    const storeId = await resolveStoreIdForRider(rider);
    const slotMeta = findShiftSlot(slot);

    if (storeId) {
      try {
        getIO().to(`store_${storeId}`).emit("rider_shift_booked", {
          riderId: rider._id.toString(),
          name: rider.name || rider.phone,
          slot,
          slotLabel: slotMeta?.label || slot,
          date: date.toISOString(),
          bookedAt: rider.shiftBooking.bookedAt.toISOString(),
        });
      } catch (err) {
        console.warn("[socket] rider_shift_booked emit failed:", err.message);
      }
    }

    return res.json({
      success: true,
      message: "Shift booked",
      shiftBooking: rider.shiftBooking,
      deliveryBoy: rider.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftBooking = async (req, res, next) => {
  try {
    const requestedId = String(req.params.riderId || req.user.id);
    if (
      req.user.role === "delivery_boy" &&
      requestedId !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const rider = await DeliveryBoy.findById(requestedId);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    const booking = rider.shiftBooking?.slot
      ? {
          slot: rider.shiftBooking.slot,
          date: rider.shiftBooking.date,
          bookedAt: rider.shiftBooking.bookedAt,
          ...findShiftSlot(rider.shiftBooking.slot),
        }
      : null;

    return res.json({ success: true, shiftBooking: booking });
  } catch (error) {
    next(error);
  }
};

export const getManagerShiftsByDate = async (req, res, next) => {
  try {
    const storeId = String(req.query.storeId || req.user?.id || "");
    const dateInput = req.query.date || new Date().toISOString().slice(0, 10);
    const dayStart = startOfDay(new Date(dateInput));
    const dayEnd = endOfDay(dayStart);

    const manager = await DeliveryManager.findById(storeId);
    if (!manager) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    const riders = await DeliveryBoy.find({
      $and: [
        areaMatchForManager(manager),
        { "shiftBooking.slot": { $ne: "" } },
        { "shiftBooking.date": { $gte: dayStart, $lte: dayEnd } },
      ],
    }).select("name phone shiftBooking area city status");

    const grouped = {};
    for (const slot of SHIFT_SLOTS) {
      grouped[slot.slot] = {
        slot: slot.slot,
        label: slot.label,
        start: slot.start,
        end: slot.end,
        riders: [],
        count: 0,
      };
    }

    for (const r of riders) {
      const key = r.shiftBooking.slot;
      if (!grouped[key]) continue;
      grouped[key].riders.push({
        riderId: r._id.toString(),
        name: r.name || r.phone,
        phone: r.phone,
        status: r.status,
        area: r.area,
        bookedAt: r.shiftBooking.bookedAt,
      });
      grouped[key].count += 1;
    }

    return res.json({
      success: true,
      storeId,
      date: dayStart.toISOString().slice(0, 10),
      slots: Object.values(grouped),
    });
  } catch (error) {
    next(error);
  }
};

export { findShiftSlot, SHIFT_SLOTS };
