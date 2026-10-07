import Order from "../models/order/Order.js";
import { getStoreSettings } from "./storeSettingsHelpers.js";
import {
  formatIndiaDateString,
  shiftIndiaDateString,
} from "../../../shared/date/indiaDate.js";

export function normalizePreOrderSlot(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 60);
}

export function preOrderSlotLabel(slot) {
  return normalizePreOrderSlot(`${slot?.startTime || ""} - ${slot?.endTime || ""}`);
}

/** Pre-orders are delivered on the next calendar day (IST). */
export function computePreOrderDate(from = new Date()) {
  return shiftIndiaDateString(formatIndiaDateString(from), 1);
}

const BOOKED_STATUS_FILTER = { $nin: ["attempted", "cancelled"] };

export function isPreOrderDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

/**
 * Every configured slot with its bookings for `date` (default tomorrow, IST).
 * Capacity 0 means unlimited, so `remaining` is null and the slot is never full.
 */
export async function getPreOrderSlotAvailability(date) {
  const preOrderDate = isPreOrderDateString(date) ? date : computePreOrderDate();
  const settings = await getStoreSettings();
  const configured = settings.preOrderSlots || [];

  const counts = await Order.aggregate([
    { $match: { preOrderDate, preOrderSlot: { $ne: "" }, status: BOOKED_STATUS_FILTER } },
    { $group: { _id: "$preOrderSlot", booked: { $sum: 1 } } },
  ]);
  const bookedBySlot = new Map(counts.map((row) => [row._id, row.booked]));

  const slots = configured.map((slot) => {
    const label = preOrderSlotLabel(slot);
    const capacity = Number(slot.capacity) || 0;
    const booked = bookedBySlot.get(label) || 0;
    bookedBySlot.delete(label);
    const remaining = capacity > 0 ? Math.max(0, capacity - booked) : null;
    return {
      label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity,
      booked,
      remaining,
      isActive: slot.isActive !== false,
      isFull: capacity > 0 && booked >= capacity,
    };
  });

  // Orders still booked into a slot that admin has since removed or renamed.
  for (const [label, booked] of bookedBySlot) {
    slots.push({
      label,
      startTime: "",
      endTime: "",
      capacity: 0,
      booked,
      remaining: null,
      isActive: false,
      isFull: false,
      removed: true,
    });
  }

  return { date: preOrderDate, slots };
}

/**
 * Checks the slot is configured, active and still has capacity for tomorrow.
 * Capacity 0 means unlimited. Returns { preOrderSlot, preOrderDate } or { error, status, code }.
 */
export async function validatePreOrderSlot(rawSlot, { excludeOrderId, preOrderDate: forDate } = {}) {
  const preOrderSlot = normalizePreOrderSlot(rawSlot);
  if (!preOrderSlot) return { preOrderSlot: "", preOrderDate: "" };

  const settings = await getStoreSettings();
  const slot = (settings.preOrderSlots || []).find(
    (entry) => preOrderSlotLabel(entry) === preOrderSlot
  );
  if (!slot || slot.isActive === false) {
    return {
      error: "Selected pre-order slot is no longer available. Please choose another slot.",
      status: 400,
      code: "PREORDER_SLOT_UNAVAILABLE",
    };
  }

  const preOrderDate = forDate || computePreOrderDate();
  const capacity = Number(slot.capacity) || 0;
  if (capacity > 0) {
    const booked = await Order.countDocuments({
      preOrderSlot,
      preOrderDate,
      status: BOOKED_STATUS_FILTER,
      ...(excludeOrderId ? { _id: { $ne: excludeOrderId } } : {}),
    });
    if (booked >= capacity) {
      return {
        error: `The ${preOrderSlot} slot ${forDate ? `on ${forDate}` : "for tomorrow"} is fully booked. Please choose another slot.`,
        status: 409,
        code: "PREORDER_SLOT_FULL",
      };
    }
  }

  return { preOrderSlot, preOrderDate };
}
