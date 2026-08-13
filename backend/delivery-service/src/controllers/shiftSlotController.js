import ShiftSlot from "../models/ShiftSlot.js";
import Rider from "../models/Rider.js";
import Manager from "../models/Manager.js";
import { getIO } from "../../../socket.js";
import { resolveStoreIdForRider } from "../utils/storeResolver.js";

/**
 * Manager only — Create a new shift slot for their store.
 */
export const createShiftSlot = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can create shift slots",
      });
    }

    const managerId = req.user.id;
    const { slot, label, start, end, storeId } = req.body;

    if (!slot || !label || !start || !end) {
      return res.status(400).json({
        success: false,
        message: "slot, label, start, and end times are required",
      });
    }

    const targetStoreId = storeId || managerId;

    const shiftSlot = await ShiftSlot.create({
      slot,
      label,
      start,
      end,
      storeId: targetStoreId,
      createdBy: managerId,
    });

    res.status(201).json({
      success: true,
      data: shiftSlot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create shift slot",
    });
  }
};

/**
 * Returns all shift slots for a given storeId (used by both Manager and Rider).
 */
export const getShiftSlots = async (req, res) => {
  try {
    let storeId = req.query.storeId || req.params.storeId;

    if (!storeId && req.user?.role === "delivery_manager") {
      storeId = req.user.id;
    }

    if (!storeId && req.user?.id) {
      const rider = await Rider.findById(req.user.id);
      if (rider) {
        storeId = await resolveStoreIdForRider(rider);
      }
    }

    const filter = storeId ? { storeId } : {};
    const slots = await ShiftSlot.find(filter).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch shift slots",
    });
  }
};

/**
 * Manager only — Update an existing shift slot.
 */
export const updateShiftSlot = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can update shift slots",
      });
    }

    const { id } = req.params;
    const { slot, label, start, end } = req.body;

    const updatedSlot = await ShiftSlot.findByIdAndUpdate(
      id,
      { slot, label, start, end },
      { new: true, runValidators: true }
    );

    if (!updatedSlot) {
      return res.status(404).json({
        success: false,
        message: "Shift slot not found",
      });
    }

    res.json({
      success: true,
      data: updatedSlot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update shift slot",
    });
  }
};

/**
 * Manager only — Delete a shift slot.
 */
export const deleteShiftSlot = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can delete shift slots",
      });
    }

    const { id } = req.params;
    const deletedSlot = await ShiftSlot.findByIdAndDelete(id);

    if (!deletedSlot) {
      return res.status(404).json({
        success: false,
        message: "Shift slot not found",
      });
    }

    res.json({
      success: true,
      message: "Shift slot deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete shift slot",
    });
  }
};

/**
 * Rider only — Select/Book a shift slot for a date. Updates rider document & emits socket event.
 */
export const bookShiftSlot = async (req, res) => {
  try {
    const riderId = req.user.id;
    const { slot, date } = req.body;

    if (!slot || !date) {
      return res.status(400).json({
        success: false,
        message: "slot and date are required to book a shift",
      });
    }

    const bookingDate = new Date(date);
    const bookedAt = new Date();

    const rider = await Rider.findByIdAndUpdate(
      riderId,
      {
        shiftBooking: {
          slot,
          date: bookingDate,
          bookedAt,
        },
      },
      { new: true }
    );

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Resolve storeId and emit socket event to store room
    const storeId = await resolveStoreIdForRider(rider);
    if (storeId) {
      try {
        getIO().to(`store_${storeId}`).emit("rider_shift_booked", {
          riderId: rider._id,
          riderName: rider.name,
          slot,
          date: bookingDate,
          bookedAt,
        });
      } catch (ioErr) {
        console.warn("[shiftSlotController] Socket emit warning:", ioErr.message);
      }
    }

    res.json({
      success: true,
      data: rider.shiftBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to book shift slot",
    });
  }
};

/**
 * Manager only — Returns all riders in the store grouped by booked shift slot for a date.
 */
export const getStoreShiftOverview = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can view store shift overview",
      });
    }

    const manager = await Manager.findById(req.user.id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Find riders matching manager's store / city / area
    const riders = await Rider.find({
      $or: [
        { cityId: manager.cityId, area: manager.area },
        { city: manager.city, area: manager.area },
      ],
      isActive: true,
    });

    const shiftSlots = await ShiftSlot.find({ storeId: manager._id });

    // Group riders by shift slot
    const grouped = {
      morning: [],
      midday: [],
      evening_peak: [],
      late_night: [],
      unbooked: [],
    };

    riders.forEach((r) => {
      const bDate = r.shiftBooking?.date ? new Date(r.shiftBooking.date) : null;
      if (bDate && bDate >= startOfDay && bDate <= endOfDay && r.shiftBooking?.slot) {
        const slotKey = r.shiftBooking.slot;
        if (grouped[slotKey]) {
          grouped[slotKey].push(r.toSafeJSON());
        } else {
          grouped.unbooked.push(r.toSafeJSON());
        }
      } else {
        grouped.unbooked.push(r.toSafeJSON());
      }
    });

    res.json({
      success: true,
      data: {
        date: startOfDay,
        availableSlots: shiftSlots,
        overview: grouped,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch store shift overview",
    });
  }
};
