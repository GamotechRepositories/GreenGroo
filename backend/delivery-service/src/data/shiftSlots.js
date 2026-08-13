/** Hardcoded shift slots — admin-editable later. */
export const SHIFT_SLOTS = [
  { slot: "morning", label: "Morning", start: "07:00", end: "11:00" },
  { slot: "midday", label: "Midday", start: "11:00", end: "15:00" },
  { slot: "evening_peak", label: "Evening Peak", start: "18:00", end: "22:00" },
  { slot: "late_night", label: "Late Night", start: "22:00", end: "01:00" },
];

export const VALID_SHIFT_SLOTS = new Set(SHIFT_SLOTS.map((s) => s.slot));

export const findShiftSlot = (slot) =>
  SHIFT_SLOTS.find((s) => s.slot === slot) || null;
