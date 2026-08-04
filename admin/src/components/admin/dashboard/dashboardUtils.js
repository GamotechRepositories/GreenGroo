export function getDayChange(todayValue, yesterdayValue) {
  const today = Number(todayValue) || 0;
  const yesterday = Number(yesterdayValue) || 0;

  if (yesterday === 0) {
    if (today === 0) return { percent: 0, direction: "flat" };
    return { percent: 100, direction: "up" };
  }

  const change = ((today - yesterday) / yesterday) * 100;
  const rounded = Math.abs(Math.round(change));

  if (change > 0) return { percent: rounded, direction: "up" };
  if (change < 0) return { percent: rounded, direction: "down" };
  return { percent: 0, direction: "flat" };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );
}

export function formatCompactCurrency(amount) {
  const value = Number(amount) || 0;
  if (value >= 100000) {
    return `₹ ${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹ ${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

export function getTrendClass(change, invertTrend = false) {
  const isGood = invertTrend ? change.direction === "down" : change.direction === "up";
  const isBad = invertTrend ? change.direction === "up" : change.direction === "down";

  if (isGood) return "text-green-600";
  if (isBad) return "text-red-600";
  return "text-neutral-500";
}

export function formatRelativeTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
