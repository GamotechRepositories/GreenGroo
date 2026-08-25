export function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export function formatOrderDate(value) {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function orderTitle(filter) {
  return (
    {
      new: "New Orders",
      preparing: "Preparing",
      ready: "Ready for Pickup",
      completed: "Completed",
      rejected: "Rejected",
    }[filter] || "Orders"
  );
}

export function canAccept(status) {
  return status === "NEW";
}

export function canReject(status) {
  return status === "NEW";
}

export function canPrepare(status) {
  return status === "ACCEPTED" || status === "PREPARING" || status === "PACKING";
}
