import Shift from "../models/Shift.js";
import DeliveryManager from "../models/DeliveryManager.js";

const getManager = async (req) => {
  let manager = await DeliveryManager.findById(req.user.id);
  if (!manager) {
    manager = await DeliveryManager.findOne({ isActive: true }).sort({ createdAt: 1 });
  }
  if (!manager) {
    const err = new Error("Delivery manager not found");
    err.statusCode = 404;
    throw err;
  }
  return manager;
};

const formatDateString = (d) => {
  const date = new Date(d);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Default time slots generator for standard shift types */
const getDefaultSlotsForType = (type, customSlots = [], defaultCapacity = 10) => {
  if (customSlots && customSlots.length > 0) {
    return customSlots.map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime,
      capacity: parseInt(s.capacity, 10) || defaultCapacity,
      bookedCount: 0,
      status: "AVAILABLE",
      bookings: [],
    }));
  }

  switch (type) {
    case "early_morning":
      return [
        { startTime: "06:00 AM", endTime: "08:00 AM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
        { startTime: "08:00 AM", endTime: "09:00 AM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
      ];
    case "morning":
      return [
        { startTime: "09:00 AM", endTime: "11:00 AM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
        { startTime: "11:00 AM", endTime: "01:00 PM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
      ];
    case "afternoon":
      return [
        { startTime: "01:00 PM", endTime: "03:00 PM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
        { startTime: "03:00 PM", endTime: "05:00 PM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
      ];
    case "evening":
      return [
        { startTime: "05:00 PM", endTime: "07:00 PM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
        { startTime: "07:00 PM", endTime: "09:00 PM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
      ];
    case "night":
      return [
        { startTime: "09:00 PM", endTime: "10:30 PM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
        { startTime: "10:30 PM", endTime: "12:00 AM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
      ];
    case "late_night":
      return [
        { startTime: "12:00 AM", endTime: "02:00 AM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
        { startTime: "02:00 AM", endTime: "04:00 AM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
      ];
    default:
      return [
        { startTime: "09:00 AM", endTime: "01:00 PM", capacity: defaultCapacity, bookedCount: 0, status: "AVAILABLE", bookings: [] },
      ];
  }
};

/** Generates date-wise Shift documents directly in single Shift collection */
const generateDateWiseShifts = async ({
  name,
  type,
  capacity,
  customSlots,
  manager,
  recurrenceMode,
  targetDate,
  targetMonth,
  daysOfWeek = [],
}) => {
  const createdShifts = [];
  const now = new Date();
  const datesToGenerate = [];

  if (recurrenceMode === "single_day") {
    const dStr = targetDate || formatDateString(now);
    datesToGenerate.push(dStr);
  } else if (recurrenceMode === "full_week") {
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dayNum = d.getDay();
      if (daysOfWeek.length === 0 || daysOfWeek.includes(dayNum)) {
        datesToGenerate.push(formatDateString(d));
      }
    }
  } else if (recurrenceMode === "full_month") {
    const [yrStr, moStr] = (targetMonth || formatDateString(now)).split("-");
    const year = parseInt(yrStr, 10) || now.getFullYear();
    const month = parseInt(moStr, 10) - 1 || now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(Date.UTC(year, month, day));
      const dayNum = d.getUTCDay();
      if (daysOfWeek.length === 0 || daysOfWeek.includes(dayNum)) {
        datesToGenerate.push(formatDateString(d));
      }
    }
  }

  const defaultSlots = getDefaultSlotsForType(type, customSlots, capacity);

  for (const dateStr of datesToGenerate) {
    const slotDate = new Date(`${dateStr}T00:00:00.000Z`);

    const existing = await Shift.findOne({
      managerId: manager._id,
      dateString: dateStr,
      type,
    });

    if (!existing) {
      const newShift = await Shift.create({
        managerId: manager._id,
        storeId: manager._id.toString(),
        name,
        type,
        date: slotDate,
        dateString: dateStr,
        slots: defaultSlots,
      });
      createdShifts.push(newShift);
    } else {
      // Overwrite/update slots for this shift type on this date
      existing.name = name || existing.name;
      existing.slots = defaultSlots;
      await existing.save();
      createdShifts.push(existing);
    }
  }

  return createdShifts;
};

export const createShift = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const {
      name,
      type = "morning",
      capacity = 10,
      maxCapacityPerSlot = 10,
      customSlots = [],
      recurrenceMode = "single_day",
      targetDate,
      targetMonth,
      daysOfWeek = [],
    } = req.body;

    const shiftType = String(type).toLowerCase();
    const shiftName = name || `${shiftType.replace("_", " ").toUpperCase()} Shift`;
    const slotCapacity = parseInt(capacity || maxCapacityPerSlot, 10) || 10;

    const generatedShifts = await generateDateWiseShifts({
      name: shiftName,
      type: shiftType,
      capacity: slotCapacity,
      customSlots,
      manager,
      recurrenceMode,
      targetDate,
      targetMonth,
      daysOfWeek,
    });

    return res.status(201).json({
      success: true,
      message: `Created '${shiftName}' with ${generatedShifts.length} date shifts in single Shift collection!`,
      generatedCount: generatedShifts.length,
      shifts: generatedShifts.map((s) => s.toSafeJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const listShifts = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const dateInput = req.query.date || formatDateString(new Date());

    const shifts = await Shift.find({
      managerId: manager._id,
      dateString: dateInput,
    }).sort({ createdAt: 1 });

    const safeShifts = shifts.map((s) => s.toSafeJSON());

    // Flatten all slots across shifts for slot-level API responses
    const allSlots = [];
    for (const shiftJson of safeShifts) {
      for (const slot of shiftJson.slots) {
        allSlots.push({
          ...slot,
          shiftName: shiftJson.name,
          shiftType: shiftJson.type,
          dateString: shiftJson.dateString,
        });
      }
    }

    return res.json({
      success: true,
      date: dateInput,
      storeName: manager.storeName || `${manager.area} Dark Store`,
      storeAddress: manager.storeAddress || `${manager.area}, ${manager.city}`,
      shifts: safeShifts,
      slots: allSlots,
    });
  } catch (error) {
    next(error);
  }
};

export const listManagerSlots = async (req, res, next) => {
  return listShifts(req, res, next);
};

export const updateSlotDateWise = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { slotId } = req.params;
    const { capacity, status, startTime, endTime } = req.body;

    const shift = await Shift.findOne({
      managerId: manager._id,
      $or: [{ _id: slotId }, { "slots._id": slotId }],
    });

    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift slot not found" });
    }

    const slot = shift.slots.find((s) => s._id.toString() === slotId || shift._id.toString() === slotId);

    if (slot) {
      if (capacity !== undefined) {
        const capNum = parseInt(capacity, 10);
        if (capNum < slot.bookedCount) {
          return res.status(400).json({
            success: false,
            message: `Cannot reduce capacity below currently booked count (${slot.bookedCount})`,
          });
        }
        slot.capacity = capNum;
      }
      if (status) slot.status = status;
      if (startTime) slot.startTime = startTime;
      if (endTime) slot.endTime = endTime;
      shift.isCustomized = true;

      await shift.save();
    }

    return res.json({
      success: true,
      message: "Shift slot updated independently for this date",
      shift: shift.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSlotDateWise = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { slotId } = req.params;

    const shift = await Shift.findOne({
      managerId: manager._id,
      $or: [{ _id: slotId }, { "slots._id": slotId }],
    });

    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift slot not found" });
    }

    const slot = shift.slots.find((s) => s._id.toString() === slotId || shift._id.toString() === slotId);

    if (slot && slot.bookedCount > 0) {
      slot.status = "CANCELLED";
      slot.bookings.forEach((b) => {
        b.status = "CANCELLED";
      });
      await shift.save();

      return res.json({
        success: true,
        message: `Shift slot cancelled. Registered delivery partners notified.`,
        shift: shift.toSafeJSON(),
      });
    }

    if (shift.slots.length > 1 && slot) {
      shift.slots = shift.slots.filter((s) => s._id.toString() !== slotId);
      await shift.save();
    } else {
      await Shift.findByIdAndDelete(shift._id);
    }

    return res.json({
      success: true,
      message: "Shift slot deleted for this date",
    });
  } catch (error) {
    next(error);
  }
};

export const getSlotDetailsWithRiders = async (req, res, next) => {
  try {
    const manager = await getManager(req);
    const { slotId } = req.params;

    const shift = await Shift.findOne({
      managerId: manager._id,
      $or: [{ _id: slotId }, { "slots._id": slotId }],
    });

    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift slot not found" });
    }

    const slot = shift.slots.find((s) => s._id.toString() === slotId || shift._id.toString() === slotId) || shift.slots[0];

    const ridersList = (slot.bookings || [])
      .filter((b) => b.status !== "CANCELLED")
      .map((b) => ({
        bookingId: b._id.toString(),
        deliveryPartnerId: b.deliveryPartnerId.toString(),
        deliveryPartnerName: b.deliveryPartnerName || "Delivery Partner",
        deliveryPartnerPhone: b.deliveryPartnerPhone,
        deliveryPartnerProfileImage: b.deliveryPartnerProfileImage || "",
        bookedAt: b.bookedAt,
        status: b.status,
      }));

    return res.json({
      success: true,
      shift: shift.toSafeJSON(),
      slotId: slot._id.toString(),
      capacity: slot.capacity,
      bookedCount: slot.bookedCount,
      remainingCapacity: Math.max(0, slot.capacity - slot.bookedCount),
      deliveryPartners: ridersList,
    });
  } catch (error) {
    next(error);
  }
};
