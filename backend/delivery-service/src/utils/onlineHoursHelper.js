/** Reset daily online minutes when the calendar day changes (local server time). */
export function ensureTodayOnlineTracking(rider) {
  const today = new Date().toISOString().slice(0, 10);
  if (rider.todayOnlineDate !== today) {
    rider.todayOnlineMinutes = 0;
    rider.todayOnlineDate = today;
  }
}

export function addOnlineMinutesSince(rider, fromDate, toDate = new Date()) {
  if (!fromDate) return 0;
  const ms = Math.max(0, toDate.getTime() - new Date(fromDate).getTime());
  return Math.floor(ms / 60000);
}

export function formatOnlineMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
