/** IST calendar date YYYY-MM-DD */
export function istDateString(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Reset daily online minutes when the IST calendar day changes; snapshot previous day. */
export function ensureTodayOnlineTracking(rider) {
  const today = istDateString();
  if (rider.todayOnlineDate && rider.todayOnlineDate !== today) {
    snapshotDailyActivity(rider, {
      date: rider.todayOnlineDate,
      onlineMinutes: rider.todayOnlineMinutes || 0,
      earnings: rider.todayEarnings || 0,
      trips: rider.todayCompletedOrders || rider.todayOrderCount || 0,
    });
    rider.todayOnlineMinutes = 0;
    rider.todayOnlineDate = today;
  } else if (!rider.todayOnlineDate) {
    rider.todayOnlineDate = today;
  }
}

export function snapshotDailyActivity(rider, partial = {}) {
  const date = partial.date || rider.todayOnlineDate;
  if (!date) return;
  if (!Array.isArray(rider.dailyActivity)) rider.dailyActivity = [];

  const idx = rider.dailyActivity.findIndex((row) => row.date === date);
  const next = {
    date,
    onlineMinutes: Number(partial.onlineMinutes ?? 0),
    earnings: Number(partial.earnings ?? 0),
    trips: Number(partial.trips ?? 0),
    shiftsBooked: Number(partial.shiftsBooked ?? 0),
    shiftsCompleted: Number(partial.shiftsCompleted ?? 0),
  };

  if (idx >= 0) {
    const prev = rider.dailyActivity[idx];
    rider.dailyActivity[idx] = {
      date,
      onlineMinutes: Math.max(Number(prev.onlineMinutes || 0), next.onlineMinutes),
      earnings: Math.max(Number(prev.earnings || 0), next.earnings),
      trips: Math.max(Number(prev.trips || 0), next.trips),
      shiftsBooked: Math.max(Number(prev.shiftsBooked || 0), next.shiftsBooked),
      shiftsCompleted: Math.max(Number(prev.shiftsCompleted || 0), next.shiftsCompleted),
    };
  } else {
    rider.dailyActivity.push(next);
  }

  // Keep ~400 days max
  if (rider.dailyActivity.length > 400) {
    rider.dailyActivity = rider.dailyActivity.slice(-400);
  }
}

export function addOnlineMinutesSince(rider, fromDate, toDate = new Date()) {
  if (!fromDate) return 0;
  const ms = Math.max(0, toDate.getTime() - new Date(fromDate).getTime());
  return Math.floor(ms / 60000);
}

export function formatOnlineMinutes(totalMinutes) {
  const total = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Live online minutes including current open session */
export function liveOnlineMinutes(rider, now = new Date()) {
  let minutes = Math.max(0, Number(rider.todayOnlineMinutes || 0));
  if (
    (rider.status === "online" || rider.status === "on_delivery") &&
    rider.lastOnlineAt
  ) {
    minutes += addOnlineMinutesSince(rider, rider.lastOnlineAt, now);
  }
  return minutes;
}

export function istDayRange(dateString) {
  return {
    start: new Date(`${dateString}T00:00:00+05:30`),
    end: new Date(`${dateString}T23:59:59.999+05:30`),
  };
}

/** Previous N IST calendar days including today (oldest → newest). */
export function listRecentIstDates(dayCount) {
  const dates = [];
  const n = Math.max(1, Math.floor(Number(dayCount) || 1));
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setTime(d.getTime() - i * 24 * 60 * 60 * 1000);
    dates.push(istDateString(d));
  }
  return dates;
}

/** All IST dates in a calendar month (YYYY-MM). */
export function listIstDatesInMonth(year, month1to12) {
  const dates = [];
  const y = Number(year);
  const m = Number(month1to12);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(
      `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }
  return dates;
}
