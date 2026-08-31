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

export const getCurrentMinutesIST = (now = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  return timeToMinutes(formatter.format(now));
};

/** True when a slot that ends at midnight (e.g. 10 PM–12 AM) has passed for today. */
export const isSlotEnded = (startTime, endTime, currentMinutes) => {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (endMin > startMin) {
    return currentMinutes >= endMin;
  }

  return currentMinutes >= endMin && currentMinutes < startMin;
};

/** True when current time is inside the slot window (supports overnight slots). */
export const isWithinSlot = (startTime, endTime, currentMinutes, earlyMinutes = 0) => {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const allowedStart = Math.max(0, startMin - earlyMinutes);

  if (endMin > startMin) {
    return currentMinutes >= allowedStart && currentMinutes < endMin;
  }

  return currentMinutes >= allowedStart || currentMinutes < endMin;
};
