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
      status: { $nin: ["attempted", "cancelled"] },
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
