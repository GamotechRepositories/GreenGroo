import DeliveryBoy from "../models/DeliveryBoy.js";
import Shift from "../models/Shift.js";
import { getIO } from "../../../socket.js";
import {
  applyGigStatusChange,
  emitRiderStatusUpdated,
} from "./riderSocketService.js";
import { istDateString } from "../utils/onlineHoursHelper.js";
import {
  getCurrentMinutesIST,
  isSlotEnded,
} from "../utils/shiftTimeHelper.js";

const POLL_MS = 5000;
let _running = false;
let _timer = null;

/**
 * Force a rider offline after their booked shift slot ends.
 * Updates profile status, marks booking COMPLETED, notifies rider + manager dashboards.
 */
async function forceRiderOfflineForEndedShift(rider, shift, slot, booking) {
  const wasOnline = rider.status === "online";
  const wasOnDelivery = rider.status === "on_delivery";

  // Mark booking completed on the shift
  if (booking && booking.status !== "COMPLETED" && booking.status !== "CANCELLED") {
    booking.status = "COMPLETED";
    booking.completedAt = new Date();
  }

  // Clear booking pointer on rider
  rider.currentBooking = {
    shiftId: null,
    slotId: null,
    bookingId: null,
  };

  if (wasOnline) {
    await applyGigStatusChange(rider, "offline");
  } else if (wasOnDelivery) {
    // Don't interrupt active delivery — stay on_delivery but booking is cleared.
    // After delivery completes they won't remain "shift-online".
    rider.lastStatusAt = new Date();
  }

  await rider.save();
  if (shift) await shift.save().catch(() => {});

  const extras = { reason: "shift_ended", todayOnlineMinutes: rider.todayOnlineMinutes || 0 };
  await emitRiderStatusUpdated(rider, extras);

  try {
    const io = getIO();
    io.to(`rider_${rider._id}`).emit("forced_offline", {
      reason: "shift_ended",
      message: "Your shift slot has ended. You are now offline.",
      status: rider.status,
      endTime: slot?.endTime || "",
      dateString: shift?.dateString || "",
    });
    if (wasOnline) {
      io.to(`rider_${rider._id}`).emit("status_updated", {
        status: "offline",
        reason: "shift_ended",
      });
    }
  } catch (_) {}

  console.log(
    `[ShiftEndOffline] Rider ${rider._id} (${rider.phone || rider.name}) — shift ended${
      wasOnline ? ", forced OFFLINE" : " (on delivery, booking cleared)"
    }`
  );
}

async function processRiderWithBooking(rider) {
  const shiftId = rider.currentBooking?.shiftId;
  if (!shiftId) return false;

  const shift = await Shift.findById(shiftId);
  if (!shift) {
    // Orphan pointer — clear and offline if online
    rider.currentBooking = { shiftId: null, slotId: null, bookingId: null };
    if (rider.status === "online") {
      await applyGigStatusChange(rider, "offline");
    }
    await rider.save();
    await emitRiderStatusUpdated(rider, { reason: "shift_missing" });
    return true;
  }

  const todayStr = istDateString();
  const currentMin = getCurrentMinutesIST();

  // Past-day bookings are always ended
  const pastDay = shift.dateString && shift.dateString < todayStr;

  const slot =
    (rider.currentBooking.slotId && shift.slots.id(rider.currentBooking.slotId)) ||
    null;

  if (!slot) {
    rider.currentBooking = { shiftId: null, slotId: null, bookingId: null };
    if (rider.status === "online") {
      await applyGigStatusChange(rider, "offline");
    }
    await rider.save();
    await emitRiderStatusUpdated(rider, { reason: "slot_missing" });
    return true;
  }

  const booking =
    (rider.currentBooking.bookingId &&
      (slot.bookings.id(rider.currentBooking.bookingId) ||
        slot.bookings.find(
          (b) =>
            b._id?.toString() === rider.currentBooking.bookingId.toString() ||
            b.bookingId === rider.currentBooking.bookingId.toString()
        ))) ||
    slot.bookings.find(
      (b) => b.deliveryPartnerId?.toString() === rider._id.toString()
    );

  const ended =
    pastDay || isSlotEnded(slot.startTime, slot.endTime, currentMin);

  if (!ended) return false;

  await forceRiderOfflineForEndedShift(rider, shift, slot, booking);
  return true;
}

/**
 * Also catch online riders whose booking pointer is missing but today's shift slot ended.
 */
async function processOnlineRidersWithoutPointer() {
  const todayStr = istDateString();
  const currentMin = getCurrentMinutesIST();

  const onlineRiders = await DeliveryBoy.find({
    status: "online",
    $or: [
      { "currentBooking.shiftId": null },
      { "currentBooking.shiftId": { $exists: false } },
    ],
  }).limit(200);

  if (!onlineRiders.length) return;

  const shifts = await Shift.find({
    dateString: todayStr,
    "slots.bookings.deliveryPartnerId": {
      $in: onlineRiders.map((r) => r._id),
    },
  });

  for (const rider of onlineRiders) {
    let matched = null;
    for (const shift of shifts) {
      for (const slot of shift.slots || []) {
        const booking = (slot.bookings || []).find(
          (b) =>
            b.deliveryPartnerId?.toString() === rider._id.toString() &&
            b.status !== "CANCELLED" &&
            b.status !== "COMPLETED"
        );
        if (!booking) continue;
        if (isSlotEnded(slot.startTime, slot.endTime, currentMin)) {
          matched = { shift, slot, booking };
          break;
        }
      }
      if (matched) break;
    }
    if (matched) {
      await forceRiderOfflineForEndedShift(
        rider,
        matched.shift,
        matched.slot,
        matched.booking
      );
    }
  }
}

export async function forceOfflineEndedShiftRiders() {
  if (_running) return;
  _running = true;
  try {
    const riders = await DeliveryBoy.find({
      status: { $in: ["online", "on_delivery"] },
      "currentBooking.shiftId": { $ne: null },
    }).limit(300);

    for (const rider of riders) {
      try {
        await processRiderWithBooking(rider);
      } catch (err) {
        console.warn(
          `[ShiftEndOffline] Failed for rider ${rider._id}:`,
          err.message
        );
      }
    }

    try {
      await processOnlineRidersWithoutPointer();
    } catch (err) {
      console.warn("[ShiftEndOffline] Fallback scan failed:", err.message);
    }
  } catch (err) {
    console.error("[ShiftEndOffline] Tick error:", err.message);
  } finally {
    _running = false;
  }
}

/** Poll every 5 seconds so shift-end offline happens within ~5s. */
export function initShiftEndOfflineCron() {
  if (_timer) return;
  _timer = setInterval(() => {
    forceOfflineEndedShiftRiders();
  }, POLL_MS);
  // First run shortly after boot
  setTimeout(() => forceOfflineEndedShiftRiders(), 2000);
  console.log(
    "[ShiftEndOffline] Auto-offline job scheduled (every 5s when shift slot ends)."
  );
}
