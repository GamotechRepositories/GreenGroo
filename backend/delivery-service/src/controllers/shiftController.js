import mongoose from "mongoose";
import Shift from "../models/Shift.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import { getIO } from "../../../socket.js";

/** Formats Date or string into "YYYY-MM-DD" string in IST (Asia/Kolkata) timezone */
export const formatDateStringIST = (d) => {
  const date = d ? new Date(d) : new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // YYYY-MM-DD
};

/** Converts "09:30 AM" or "17:30" to minutes from start of day */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const s = String(timeStr).trim().toUpperCase();
  const isPM = s.includes("PM");
  const isAM = s.includes("AM");
  const clean = s.replace(/AM|PM/g, "").trim();
  const [hStr, mStr] = clean.split(":");
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
};

/** Helper to resolve the exact DeliveryManager for a rider */
export const getRiderManager = async (rider) => {
  if (!rider) return null;
  let manager = null;
  const riderArea = (rider.area || "").trim().toLowerCase();

  if (rider.managerId) {
    manager = await DeliveryManager.findById(rider.managerId);
    if (manager) {
      const managerArea = (manager.area || "").trim().toLowerCase();
      if (riderArea && managerArea && riderArea !== managerArea) {
        manager = null;
      }
    }
  }

  if (!manager && (rider.cityId || rider.area || rider.city)) {
    const escapedArea = (rider.area || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    manager = await DeliveryManager.findOne({
      isActive: true,
      $or: [
        ...(escapedArea ? [{ area: { $regex: new RegExp(`^${escapedArea}$`, "i") } }] : []),
        { cityId: rider.cityId, area: rider.area },
        { city: rider.city, area: rider.area },
      ],
    }).sort({ createdAt: -1 });

    if (manager) {
      if (!rider.managerId || rider.managerId.toString() !== manager._id.toString()) {
        rider.managerId = manager._id;
        rider.storeId = manager._id.toString();
        await rider.save().catch(() => {});
      }
    } else if (rider.managerId) {
      rider.managerId = null;
      rider.storeId = "";
      await rider.save().catch(() => {});
    }
  }
  return manager;
};

/**
 * 1. bookSlot — Rider books shiftId + slotId
 * Atomically enforces bookedCount < capacity using findOneAndUpdate with arrayFilters and $expr guard.
 * Wrapped in a Mongoose session transaction for two-document consistency.
 */
export const bookSlot = async (req, res, next) => {
  try {
    const inputSlotId = String(req.body.slotId || req.body.shiftId || req.body.id || "").trim();
    let inputShiftId = String(req.body.shiftId || "").trim();

    if (!inputSlotId) {
      return res.status(400).json({
        success: false,
        message: "slotId is required",
      });
    }

    const rider = await DeliveryBoy.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    if (rider.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your delivery partner profile is inactive.",
      });
    }

    let manager = await getRiderManager(rider);

    // Auto-lookup Shift document by shiftId or slotId
    let targetShift = null;
    if (inputShiftId && mongoose.Types.ObjectId.isValid(inputShiftId)) {
      targetShift = await Shift.findById(inputShiftId);
    }

    if (!targetShift && mongoose.Types.ObjectId.isValid(inputSlotId)) {
      targetShift = await Shift.findOne({
        $or: [{ _id: inputSlotId }, { "slots._id": inputSlotId }],
      });
    }

    if (!targetShift) {
      return res.status(404).json({ success: false, message: "Shift slot is no longer available" });
    }

    if (manager && (!targetShift.managerId || targetShift.managerId.toString() !== manager._id.toString())) {
      targetShift.managerId = manager._id;
      targetShift.storeId = manager._id.toString();
    }

    let targetSlot = targetShift.slots.find(
      (s) => s._id.toString() === inputSlotId || targetShift._id.toString() === inputSlotId
    );
    if (!targetSlot && targetShift.slots.length > 0) {
      targetSlot = targetShift.slots[0];
    }

    if (!targetSlot) {
      return res.status(404).json({ success: false, message: "Shift slot is no longer available" });
    }

    if (targetSlot.status === "CANCELLED") {
      return res.status(409).json({
        success: false,
        message: "This shift slot has been cancelled by store management.",
      });
    }

    // Check if rider already has an active non-cancelled booking in this slot
    const existingBookingInSlot = targetSlot.bookings.find(
      (b) => b.deliveryPartnerId.toString() === rider._id.toString() && b.status !== "CANCELLED"
    );
    if (existingBookingInSlot) {
      return res.status(200).json({
        success: true,
        message: "You already have an active booking for this shift slot.",
        booking: {
          id: existingBookingInSlot._id ? existingBookingInSlot._id.toString() : existingBookingInSlot.bookingId,
          bookingId: existingBookingInSlot._id ? existingBookingInSlot._id.toString() : existingBookingInSlot.bookingId,
          slotId: targetSlot._id.toString(),
          shiftId: targetShift._id.toString(),
          dateString: targetShift.dateString,
          startTime: targetSlot.startTime,
          endTime: targetSlot.endTime,
          status: existingBookingInSlot.status,
          bookedAt: existingBookingInSlot.bookedAt,
        },
        currentBooking: rider.currentBooking,
        shift: targetShift.toSafeJSON(),
      });
    }

    if (targetSlot.bookedCount >= targetSlot.capacity) {
      return res.status(409).json({
        success: false,
        message: "FULLY BOOKED! Capacity reached for this shift slot. Please select another slot.",
      });
    }

    const bookingObjectId = new mongoose.Types.ObjectId();

    const newBookingObj = {
      _id: bookingObjectId,
      bookingId: bookingObjectId.toString(),
      deliveryPartnerId: rider._id,
      deliveryPartnerPhone: rider.phone || "",
      deliveryPartnerName: rider.name || "Delivery Partner",
      deliveryPartnerProfileImage: rider.selfie?.imageBase64 || "",
      bookedAt: new Date(),
      status: "UPCOMING",
      notificationEnabled: false,
      notificationTimeMinutes: 15,
    };

    targetSlot.bookings.push(newBookingObj);
    targetSlot.bookedCount = targetSlot.bookings.filter((b) => b.status !== "CANCELLED").length;
    await targetShift.save();

    rider.currentBooking = {
      shiftId: targetShift._id,
      slotId: targetSlot._id,
      bookingId: bookingObjectId,
    };
    await rider.save();

    try {
      const io = getIO();
      const payload = {
        shiftId: targetShift._id.toString(),
        slotId: targetSlot._id.toString(),
        bookingId: bookingObjectId.toString(),
        riderId: rider._id.toString(),
        name: rider.name || rider.phone,
        phone: rider.phone,
        bookedAt: newBookingObj.bookedAt,
      };
      if (targetShift.managerId) {
        io.to(`store_${targetShift.managerId}`).emit("rider_shift_booked", payload);
      }
      if (rider.area) {
        io.to(`area_${rider.area}`).emit("rider_shift_booked", payload);
      }
      io.emit("shift_updated", { shiftId: targetShift._id.toString() });
    } catch (err) {
      console.warn("[socket] rider_shift_booked emit failed:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Shift Booked Successfully!",
      currentBooking: rider.currentBooking,
      booking: {
        id: bookingObjectId.toString(),
        bookingId: bookingObjectId.toString(),
        slotId: targetSlot._id.toString(),
        shiftId: targetShift._id.toString(),
        dateString: targetShift.dateString,
        startTime: targetSlot.startTime,
        endTime: targetSlot.endTime,
        status: newBookingObj.status,
        bookedAt: newBookingObj.bookedAt,
      },
      shift: targetShift.toSafeJSON(),
    });
  } catch (error) {
    if (inTransaction) {
      await session.abortTransaction();
    }
    session.endSession();
    next(error);
  }
};

/**
 * 2. cancelBooking — Rider cancels their booking.
 * Guard against double-cancellation: returns 409 immediately if booking.status === "CANCELLED".
 * Wrapped in a session transaction.
 */
export const cancelBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  let inTransaction = false;
  try {
    session.startTransaction();
    inTransaction = true;
  } catch (err) {
    inTransaction = false;
  }

  try {
    const sessionOptions = inTransaction ? { session } : {};

    const rider = await DeliveryBoy.findById(req.user.id, null, sessionOptions);
    if (!rider) {
      if (inTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    const targetBooking = req.body.bookingId || req.params.bookingId || rider.currentBooking?.bookingId;
    let targetShiftId = req.body.shiftId || rider.currentBooking?.shiftId;
    let targetSlotId = req.body.slotId || rider.currentBooking?.slotId;

    let shift = null;
    if (targetShiftId && mongoose.Types.ObjectId.isValid(targetShiftId)) {
      shift = await Shift.findById(targetShiftId, null, sessionOptions);
    }

    if (!shift && targetBooking) {
      shift = await Shift.findOne(
        {
          $or: [
            { "slots.bookings._id": targetBooking },
            { "slots.bookings.bookingId": String(targetBooking) },
            { "slots.bookings.deliveryPartnerId": rider._id },
          ],
        },
        null,
        sessionOptions
      );
    }

    if (!shift) {
      if (inTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    let slot = targetSlotId ? shift.slots.id(targetSlotId) : null;
    if (!slot) {
      slot = shift.slots.find((s) =>
        s.bookings.some(
          (b) =>
            (b._id && b._id.toString() === String(targetBooking)) ||
            b.bookingId === String(targetBooking) ||
            b.deliveryPartnerId.toString() === rider._id.toString()
        )
      );
    }

    if (!slot) {
      if (inTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Slot not found" });
    }

    const booking = slot.bookings.id(targetBooking) || slot.bookings.find(
      (b) => b._id?.toString() === targetBooking.toString() || b.bookingId === targetBooking.toString()
    );

    if (!booking) {
      if (inTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.deliveryPartnerId.toString() !== rider._id.toString()) {
      if (inTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: "Forbidden: Booking belongs to another rider" });
    }

    // DOUBLE-CANCEL GUARD: Prevents phantom free capacity from duplicate cancel requests
    if (booking.status === "CANCELLED") {
      if (inTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "This shift booking is already cancelled.",
      });
    }

    booking.status = "CANCELLED";
    slot.bookedCount = Math.max(0, slot.bookedCount - 1);
    if (slot.status === "FULL") {
      slot.status = "AVAILABLE";
    }

    await shift.save(sessionOptions);

    // Clear DeliveryBoy.currentBooking pointer
    rider.currentBooking = {
      shiftId: null,
      slotId: null,
      bookingId: null,
    };
    await rider.save(sessionOptions);

    if (inTransaction) {
      await session.commitTransaction();
    }
    session.endSession();

    try {
      getIO().to(`store_${shift.managerId}`).emit("rider_shift_cancelled", {
        shiftId: shift._id.toString(),
        slotId: targetSlotId.toString(),
        bookingId: targetBooking.toString(),
        riderId: rider._id.toString(),
      });
    } catch (err) {
      console.warn("[socket] rider_shift_cancelled emit failed:", err.message);
    }

    return res.json({
      success: true,
      message: "Shift booking cancelled successfully",
      currentBooking: rider.currentBooking,
    });
  } catch (error) {
    if (inTransaction) {
      await session.abortTransaction();
    }
    session.endSession();
    next(error);
  }
};

/**
 * 3. getMyBooking — Reads DeliveryBoy.currentBooking, populates parent Shift,
 * returns just that slot + booking's live details without needing client-side Shift parsing.
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const rider = await DeliveryBoy.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    const todayStrIST = formatDateStringIST(new Date());
    const riderIdStr = rider._id.toString();

    // Query shifts matching riderId as BOTH ObjectId and String
    const shifts = await Shift.find({
      $or: [
        { "slots.bookings.deliveryPartnerId": rider._id },
        { "slots.bookings.deliveryPartnerId": riderIdStr },
      ],
    }).populate("managerId", "storeName storeAddress latitude longitude geofenceRadius");

    const upcomingBookings = [];
    let todayBooking = null;

    for (const shift of shifts) {
      for (const slot of shift.slots) {
        const userBooking = (slot.bookings || []).find(
          (b) =>
            b.deliveryPartnerId &&
            b.deliveryPartnerId.toString() === riderIdStr &&
            b.status !== "CANCELLED"
        );

        if (userBooking) {
          const bookingInfo = {
            id: userBooking._id ? userBooking._id.toString() : userBooking.bookingId,
            bookingId: userBooking._id ? userBooking._id.toString() : userBooking.bookingId,
            slotId: slot._id.toString(),
            shiftId: shift._id.toString(),
            dateString: shift.dateString,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: userBooking.status,
            storeName: shift.managerId?.storeName || `${shift.managerId?.area || "Dark"} Store`,
            storeAddress: shift.managerId?.storeAddress || `${shift.managerId?.area || ""}, ${shift.managerId?.city || ""}`,
            notificationEnabled: userBooking.notificationEnabled || false,
            notificationTimeMinutes: userBooking.notificationTimeMinutes || 15,
            bookedAt: userBooking.bookedAt,
          };

          if (shift.dateString === todayStrIST || !todayBooking) {
            todayBooking = bookingInfo;
          } else {
            upcomingBookings.push(bookingInfo);
          }
        }
      }
    }

    // Direct fallback from rider.currentBooking pointer if shifts query missed it
    if (!todayBooking && rider.currentBooking?.shiftId) {
      const shift = await Shift.findById(rider.currentBooking.shiftId).populate(
        "managerId",
        "storeName storeAddress"
      );
      if (shift) {
        const slot = shift.slots.id(rider.currentBooking.slotId);
        if (slot) {
          const b =
            slot.bookings.id(rider.currentBooking.bookingId) ||
            slot.bookings.find(
              (x) => x.deliveryPartnerId && x.deliveryPartnerId.toString() === riderIdStr && x.status !== "CANCELLED"
            );
          if (b && b.status !== "CANCELLED") {
            const fallbackBooking = {
              id: b._id ? b._id.toString() : b.bookingId,
              bookingId: b._id ? b._id.toString() : b.bookingId,
              slotId: slot._id.toString(),
              shiftId: shift._id.toString(),
              dateString: shift.dateString,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: b.status,
              storeName: shift.managerId?.storeName || "Dark Store",
              storeAddress: shift.managerId?.storeAddress || "",
              bookedAt: b.bookedAt,
            };
            if (shift.dateString === todayStrIST || !todayBooking) {
              todayBooking = fallbackBooking;
            } else {
              upcomingBookings.push(fallbackBooking);
            }
          }
        }
      }
    }

    return res.json({
      success: true,
      todayBooking,
      upcomingBookings,
      booking: todayBooking || upcomingBookings[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBooking = getMyBookings;

/**
 * 4. checkInToBooking — Helper called inside goOnline right after geofence check passes.
 * If rider has a currentBooking whose slot date/time window includes "now" (in IST),
 * sets that booking subdocument's status to "ACTIVE" and records onlineAt.
 * Non-blocking: failures or no matching booking result in a graceful no-op.
 */
export const checkInToBooking = async (rider) => {
  try {
    if (!rider || !rider.currentBooking?.shiftId) return null;

    const shift = await Shift.findById(rider.currentBooking.shiftId);
    if (!shift) return null;

    const slot = shift.slots.id(rider.currentBooking.slotId);
    if (!slot) return null;

    const booking = slot.bookings.id(rider.currentBooking.bookingId) || slot.bookings.find(
      (b) => b.deliveryPartnerId.toString() === rider._id.toString() && b.status !== "CANCELLED"
    );

    if (!booking || booking.status === "CANCELLED") return null;

    const now = new Date();
    const todayStrIST = formatDateStringIST(now);

    if (shift.dateString === todayStrIST) {
      // Calculate current time in minutes IST
      const nowISTFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      const timeStrIST = nowISTFormatter.format(now);
      const currentMinIST = timeToMinutes(timeStrIST);

      const startMin = timeToMinutes(slot.startTime);
      const endMin = timeToMinutes(slot.endTime);

      // Check-in window: 30 mins before startTime until endTime
      if (currentMinIST >= Math.max(0, startMin - 30) && currentMinIST <= endMin) {
        booking.status = "ACTIVE";
        booking.onlineAt = now;
        await shift.save();
        return booking;
      }
    }
    return null;
  } catch (err) {
    console.warn("[checkInToBooking] Non-blocking check-in warning:", err.message);
    return null;
  }
};

/**
 * Helper endpoint for riders to fetch available shifts/slots at their assigned store.
 */
export const getAvailableSlots = async (req, res, next) => {
  try {
    let rider = null;
    if (req.user?.id) {
      rider = await DeliveryBoy.findById(req.user.id).catch(() => null);
    }

    const todayStr = formatDateStringIST(new Date());
    const queryDateStr = req.query.date ? formatDateStringIST(req.query.date) : todayStr;

    let manager = rider ? await getRiderManager(rider) : null;
    if (!manager) {
      const nowTime = new Date();
      return res.json({
        success: true,
        serverTime: nowTime.toISOString(),
        date: queryDateStr,
        storeName: "No Store Assigned",
        storeAddress: "",
        slots: [],
        shifts: [],
        activeBooking: null,
        verificationPending: rider ? rider.verificationStatus !== "approved" : false,
        riderVerificationStatus: rider ? rider.verificationStatus || "pending" : "pending",
        message: "No delivery manager has registered a dark store hub in your area yet.",
      });
    }

    // 1. Query shifts for the requested date for rider's store manager
    let shifts = await Shift.find({ managerId: manager._id, dateString: queryDateStr }).sort({ createdAt: -1 });

    // 2. Fallback: If no shifts for exact queryDateStr, fetch active shifts for this manager today or future dates
    if (shifts.length === 0) {
      shifts = await Shift.find({ managerId: manager._id, dateString: { $gte: todayStr } }).sort({ dateString: 1, createdAt: -1 });
    }

    // 3. Fallback: If still 0 shifts in DB, auto-seed default shifts for the date
    if (shifts.length === 0) {
      const defaultManagerId = manager?._id || new mongoose.Types.ObjectId();
      const defaultShiftsData = [
        {
          name: "Early Morning Shift",
          type: "early_morning",
          startTime: "06:00 AM",
          endTime: "09:00 AM",
          capacity: 10,
        },
        {
          name: "Morning Shift",
          type: "morning",
          startTime: "09:00 AM",
          endTime: "01:00 PM",
          capacity: 15,
        },
        {
          name: "Afternoon Shift",
          type: "afternoon",
          startTime: "01:00 PM",
          endTime: "05:00 PM",
          capacity: 15,
        },
        {
          name: "Evening Shift",
          type: "evening",
          startTime: "05:00 PM",
          endTime: "09:00 PM",
          capacity: 20,
        },
        {
          name: "Night Shift",
          type: "night",
          startTime: "09:00 PM",
          endTime: "12:00 AM",
          capacity: 10,
        },
      ];

      for (const def of defaultShiftsData) {
        await Shift.create({
          managerId: defaultManagerId,
          storeId: defaultManagerId.toString(),
          area: manager?.area || rider.area || "Store Hub",
          name: def.name,
          type: def.type,
          dateString: queryDateStr,
          slots: [
            {
              startTime: def.startTime,
              endTime: def.endTime,
              capacity: def.capacity,
              bookedCount: 0,
              status: "AVAILABLE",
              bookings: [],
            },
          ],
        }).catch((err) => console.error("Error auto-seeding shift:", err.message));
      }

      shifts = await Shift.find({ managerId: manager._id, dateString: queryDateStr }).sort({ createdAt: -1 });
    }

    const now = new Date();
    const nowISTFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    const currentMinutesIST = timeToMinutes(nowISTFormatter.format(now));
    const isToday = queryDateStr === todayStr;

    const availableSlots = [];
    let riderActiveBooking = null;

    for (const shift of shifts) {
      const shiftJson = shift.toSafeJSON();

      for (const slot of shiftJson.slots) {
        const endMin = timeToMinutes(slot.endTime);

        const userBooking = (slot.bookings || []).find(
          (b) => b.deliveryPartnerId === rider._id.toString() && b.status !== "CANCELLED"
        );

        if (userBooking) {
          riderActiveBooking = {
            id: userBooking.bookingId,
            bookingId: userBooking.bookingId,
            slotId: slot.id,
            shiftId: shift._id.toString(),
            dateString: shift.dateString || queryDateStr,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: userBooking.status,
            storeName: manager?.storeName || "Dark Store",
            storeAddress: manager?.storeAddress || "",
          };
        }

        let slotStatus = slot.status;
        if (isToday && endMin <= currentMinutesIST) {
          slotStatus = "ENDED";
        }

        availableSlots.push({
          ...slot,
          status: slotStatus,
          shiftName: shift.name,
          shiftType: shift.type,
          storeName: manager?.storeName || "Dark Store",
          isBookedByMe: !!userBooking,
        });
      }
    }

    return res.json({
      success: true,
      serverTime: now.toISOString(),
      date: queryDateStr,
      storeName: manager?.storeName || "Dark Store Hub",
      storeAddress: manager?.storeAddress || "",
      slots: availableSlots,
      shifts: shifts.map((s) => s.toSafeJSON()),
      activeBooking: riderActiveBooking,
      verificationPending: rider.verificationStatus !== "approved",
      riderVerificationStatus: rider.verificationStatus || "pending",
    });
  } catch (error) {
    next(error);
  }
};

/** Backward-compatible export alias */
export const getShiftBooking = getMyBooking;
