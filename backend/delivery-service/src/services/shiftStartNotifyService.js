/**
 * Shift start / reminder push notifications.
 * Works when the app is closed (FCM) and also fills the in-app inbox.
 */
import Shift from "../models/Shift.js";
import { getIO } from "../../../socket.js";
import { istDateString } from "../utils/onlineHoursHelper.js";
import {
  getCurrentMinutesIST,
  isSlotEnded,
  isWithinSlot,
  timeToMinutes,
} from "../utils/shiftTimeHelper.js";
import {
  notifyShiftReminder,
  notifyShiftStarted,
} from "./RiderNotificationService.js";

const POLL_MS = 15000;
let _running = false;
let _timer = null;

export async function notifyUpcomingAndStartedShifts() {
  if (_running) return;
  _running = true;
  try {
    const todayStr = istDateString();
    const currentMin = getCurrentMinutesIST();

    const shifts = await Shift.find({ dateString: todayStr });
    if (!shifts.length) return;

    for (const shift of shifts) {
      let dirty = false;
      for (const slot of shift.slots || []) {
        if (slot.status === "CANCELLED") continue;
        const startMin = timeToMinutes(slot.startTime);
        const ended = isSlotEnded(slot.startTime, slot.endTime, currentMin);
        const live = isWithinSlot(slot.startTime, slot.endTime, currentMin, 0);

        for (const booking of slot.bookings || []) {
          if (!booking?.deliveryPartnerId) continue;
          if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
            continue;
          }

          const riderId = booking.deliveryPartnerId;
          const remindMins =
            Number(booking.notificationTimeMinutes) > 0
              ? Number(booking.notificationTimeMinutes)
              : 15;
          const reminderWindowStart = Math.max(0, startMin - remindMins);
          const inReminderWindow =
            !ended &&
            !live &&
            currentMin >= reminderWindowStart &&
            currentMin < startMin;

          if (
            inReminderWindow &&
            !booking.shiftReminderNotifiedAt &&
            booking.notificationEnabled !== false
          ) {
            try {
              await notifyShiftReminder(riderId, {
                shiftId: shift._id,
                slotId: slot._id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                dateString: shift.dateString,
                minutesLeft: Math.max(1, startMin - currentMin),
              });
              booking.shiftReminderNotifiedAt = new Date();
              dirty = true;
            } catch (err) {
              console.warn("[ShiftStartNotify] reminder failed:", err.message);
            }
          }

          if (live && !booking.shiftStartNotifiedAt) {
            try {
              await notifyShiftStarted(riderId, {
                shiftId: shift._id,
                slotId: slot._id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                dateString: shift.dateString,
              });
              try {
                getIO().to(`rider_${riderId}`).emit("shift_started", {
                  message: "You're now online and ready for orders.",
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  dateString: shift.dateString || "",
                  shiftId: String(shift._id),
                  slotId: String(slot._id),
                });
              } catch (_) {}
              booking.shiftStartNotifiedAt = new Date();
              if (booking.status === "UPCOMING") booking.status = "ACTIVE";
              dirty = true;
              console.log(
                `[ShiftStartNotify] Rider ${riderId} — shift started ${slot.startTime}-${slot.endTime}`
              );
            } catch (err) {
              console.warn("[ShiftStartNotify] start notify failed:", err.message);
            }
          }
        }
      }
      if (dirty) {
        await shift.save().catch((err) => {
          console.warn("[ShiftStartNotify] save failed:", err.message);
        });
      }
    }
  } catch (err) {
    console.error("[ShiftStartNotify] Tick error:", err.message);
  } finally {
    _running = false;
  }
}

export function initShiftStartNotifyCron() {
  if (_timer) return;
  _timer = setInterval(() => {
    notifyUpcomingAndStartedShifts();
  }, POLL_MS);
  setTimeout(() => notifyUpcomingAndStartedShifts(), 3000);
  console.log(
    "[ShiftStartNotify] Shift start/reminder push job scheduled (every 15s)."
  );
}
