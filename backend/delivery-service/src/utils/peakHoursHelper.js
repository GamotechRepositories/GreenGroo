import PeakHoursConfig from "../models/PeakHoursConfig.js";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parseHm = (hm) => {
  const [h, m] = String(hm || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Minutes since midnight; late-night end before start wraps past midnight. */
const isInRange = (nowMinutes, start, end) => {
  const s = parseHm(start);
  let e = parseHm(end);
  if (e <= s) e += 24 * 60;
  let n = nowMinutes;
  if (e > 24 * 60 && n < s) n += 24 * 60;
  return n >= s && n < e;
};

export async function isCurrentlyPeak(storeId) {
  if (!storeId) return false;

  const config = await PeakHoursConfig.findOne({ storeId: String(storeId) });
  if (!config?.peakHours?.length) return false;

  const now = new Date();
  const day = DAY_NAMES[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const dayConfig = config.peakHours.find((d) => d.day === day);
  if (!dayConfig?.ranges?.length) return false;

  return dayConfig.ranges.some((r) => isInRange(nowMinutes, r.start, r.end));
}

export async function getPeakHoursForStore(storeId) {
  const config = await PeakHoursConfig.findOne({ storeId: String(storeId) });
  return config?.peakHours || [];
}

export { DAY_NAMES };
