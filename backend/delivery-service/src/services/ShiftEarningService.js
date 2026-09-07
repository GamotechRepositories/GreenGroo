/**
 * ShiftEarningService
 *
 * Responsibilities:
 *  - Fetch the applicable Shift for a rider's active booking
 *  - Read deliveryEarningSlabs from that Shift
 *  - Calculate delivery distance using Haversine (GPS coordinates only)
 *  - Find the matching KM slab
 *  - Return the rider earning amount
 *
 * The backend is the ONLY source of truth for rider earnings.
 * Flutter must never submit an earning amount directly.
 */

import Shift from "../models/Shift.js";
import { haversineKm } from "./darkStoreResolver.js";

/**
 * Validate earning slabs array for the API layer.
 * Returns { valid: boolean, message: string }
 *
 * @param {Array} slabs
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEarningSlabs(slabs) {
  if (!Array.isArray(slabs)) return { valid: true, message: "" };

  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    if (s.minKm == null || isNaN(Number(s.minKm)) || Number(s.minKm) < 0) {
      return { valid: false, message: `Slab ${i + 1}: minKm must be >= 0` };
    }
    const minKm = Number(s.minKm);
    const maxKm = Number(s.maxKm);
    if (s.maxKm == null || isNaN(maxKm) || maxKm <= minKm) {
      return { valid: false, message: `Slab ${i + 1}: maxKm (${s.maxKm}) must be greater than minKm (${s.minKm})` };
    }
    if (s.riderAmount == null || isNaN(Number(s.riderAmount)) || Number(s.riderAmount) < 0) {
      return { valid: false, message: `Slab ${i + 1}: riderAmount must be >= 0` };
    }
    // Overlap check
    for (let j = 0; j < i; j++) {
      const a = slabs[j];
      const aMin = Number(a.minKm);
      const aMax = Number(a.maxKm);
      if (minKm < aMax && maxKm > aMin) {
        return {
          valid: false,
          message: `Slabs ${j + 1} (${a.minKm}–${a.maxKm} KM) and ${i + 1} (${s.minKm}–${s.maxKm} KM) overlap`,
        };
      }
    }
  }
  return { valid: true, message: "" };
}

/**
 * Calculate straight-line delivery distance in km between two GPS points.
 * @param {number} lat1 - Pickup/dark store latitude
 * @param {number} lng1 - Pickup/dark store longitude
 * @param {number} lat2 - Customer latitude
 * @param {number} lng2 - Customer longitude
 * @returns {number} Distance in km, rounded to 2 decimal places
 */
export function calculateDeliveryDistanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0;
  const dist = haversineKm(lat1, lng1, lat2, lng2);
  return Math.round(dist * 100) / 100; // 2dp
}

/**
 * Given a list of earning slabs and a distance in KM,
 * find the slab whose [minKm, maxKm) range contains the distance.
 * Returns the matched slab object or null.
 *
 * @param {Array<{minKm: number, maxKm: number, riderAmount: number}>} slabs
 * @param {number} distanceKm
 * @returns {{ minKm: number, maxKm: number, riderAmount: number } | null}
 */
export function findMatchingSlab(slabs, distanceKm) {
  if (!slabs || slabs.length === 0) return null;
  for (const slab of slabs) {
    if (distanceKm >= slab.minKm && distanceKm < slab.maxKm) {
      return { minKm: slab.minKm, maxKm: slab.maxKm, riderAmount: slab.riderAmount };
    }
  }
  // If distance exceeds all slab maxKm values, use the last slab (highest range)
  const sorted = [...slabs].sort((a, b) => b.maxKm - a.maxKm);
  const last = sorted[0];
  if (distanceKm >= last.minKm) {
    return { minKm: last.minKm, maxKm: last.maxKm, riderAmount: last.riderAmount };
  }
  return null;
}

/**
 * Core earning calculation for one delivery.
 *
 * @param {object} params
 * @param {string|ObjectId|null} params.shiftId - The shift ID from order.shiftId or rider.currentBooking.shiftId
 * @param {number} params.storeLat - Dark store pickup latitude
 * @param {number} params.storeLng - Dark store pickup longitude
 * @param {number} params.customerLat - Customer delivery latitude
 * @param {number} params.customerLng - Customer delivery longitude
 *
 * @returns {Promise<{
 *   riderEarning: number,
 *   distanceKm: number,
 *   earningSlab: {minKm: number, maxKm: number, riderAmount: number} | null,
 *   shift: object | null,
 *   hasSlabs: boolean
 * }>}
 */
export async function calculateRiderEarning({ shiftId, storeLat, storeLng, customerLat, customerLng }) {
  const distanceKm = calculateDeliveryDistanceKm(storeLat, storeLng, customerLat, customerLng);

  if (!shiftId) {
    return { riderEarning: 0, distanceKm, earningSlab: null, shift: null, hasSlabs: false };
  }

  let shift = null;
  try {
    shift = await Shift.findById(shiftId).lean();
  } catch (_) {
    shift = null;
  }

  if (!shift || !shift.deliveryEarningSlabs || shift.deliveryEarningSlabs.length === 0) {
    return { riderEarning: 0, distanceKm, earningSlab: null, shift, hasSlabs: false };
  }

  const slab = findMatchingSlab(shift.deliveryEarningSlabs, distanceKm);
  return {
    riderEarning: slab ? slab.riderAmount : 0,
    distanceKm,
    earningSlab: slab,
    shift,
    hasSlabs: true,
  };
}
