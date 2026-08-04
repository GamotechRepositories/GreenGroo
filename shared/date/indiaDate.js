export const INDIA_TZ = "Asia/Kolkata";
const INDIA_OFFSET = "+05:30";

export function formatIndiaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: INDIA_TZ }).format(date);
}

export function parseIndiaDateOnly(value) {
  if (!value || typeof value !== "string") return null;
  const dateString = value.trim();
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day, dateString };
}

export function getIndiaDayStart(dateOnly) {
  const parsed = parseIndiaDateOnly(dateOnly);
  if (!parsed) return null;
  return new Date(`${parsed.dateString}T00:00:00${INDIA_OFFSET}`);
}

export function getIndiaDayEnd(dateOnly) {
  const parsed = parseIndiaDateOnly(dateOnly);
  if (!parsed) return null;
  return new Date(`${parsed.dateString}T23:59:59.999${INDIA_OFFSET}`);
}

export function getIndiaTodayRange() {
  const dateString = formatIndiaDateString();
  return {
    dateString,
    start: getIndiaDayStart(dateString),
    end: getIndiaDayEnd(dateString),
  };
}

export function getIndiaYesterdayRange() {
  const todayStart = getIndiaDayStart(formatIndiaDateString());
  const yesterdayEnd = new Date(todayStart.getTime() - 1);
  const dateString = formatIndiaDateString(yesterdayEnd);

  return {
    dateString,
    start: getIndiaDayStart(dateString),
    end: getIndiaDayEnd(dateString),
  };
}

export function shiftIndiaDateString(dateString, days) {
  const start = getIndiaDayStart(dateString);
  if (!start || !Number.isFinite(days)) return null;
  return formatIndiaDateString(new Date(start.getTime() + days * 24 * 60 * 60 * 1000));
}

export function buildCreatedOnIndiaDateExpr(dateString) {
  if (!dateString) return null;
  return {
    $eq: [
      { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: INDIA_TZ } },
      dateString,
    ],
  };
}

export function buildCreatedInIndiaDateRangeExpr(startDateString, endDateString) {
  const createdDate = {
    $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: INDIA_TZ },
  };
  const clauses = [];

  if (startDateString) {
    clauses.push({ $gte: [createdDate, startDateString] });
  }
  if (endDateString) {
    clauses.push({ $lte: [createdDate, endDateString] });
  }

  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

export function getIndiaMonthDateRange(year, month) {
  const monthStr = String(month).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;
  return { startDate, endDate };
}

export function getIndiaCurrentMonthDateRange() {
  const today = formatIndiaDateString();
  const parsed = parseIndiaDateOnly(today);
  if (!parsed) return { startDate: today, endDate: today };

  const month = String(parsed.month).padStart(2, "0");
  return {
    startDate: `${parsed.year}-${month}-01`,
    endDate: today,
  };
}

export function getIndiaPreviousMonthDateRange() {
  const today = formatIndiaDateString();
  const parsed = parseIndiaDateOnly(today);
  if (!parsed) return { startDate: today, endDate: today };

  let year = parsed.year;
  let month = parsed.month - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }

  return getIndiaMonthDateRange(year, month);
}
