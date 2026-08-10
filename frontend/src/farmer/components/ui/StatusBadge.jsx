const STATUS_STYLES = {
  pending: "text-amber-700",
  approved: "text-emerald-700",
  rejected: "text-red-600",
  not_uploaded: "text-[#6B7280]",
  Draft: "text-[#6B7280]",
  "Pending Approval": "text-amber-700",
  Approved: "text-emerald-700",
  Rejected: "text-red-600",
  "Out of Stock": "text-orange-700",
  Inactive: "text-slate-600",
  New: "text-sky-700",
  Confirmed: "text-indigo-700",
  Processing: "text-violet-700",
  "Ready for Pickup": "text-teal-700",
  Completed: "text-emerald-700",
  Cancelled: "text-red-600",
  Paid: "text-emerald-700",
  Failed: "text-red-600",
  "In Stock": "text-emerald-700",
  "Low Stock": "text-amber-700",
};

function StatusBadge({ status, className = "" }) {
  const key = String(status || "");
  const style = STATUS_STYLES[key] || "text-[#374151]";
  const label = key === "not_uploaded" ? "Not Uploaded" : key.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center border border-[#D4D4D4] bg-[#F2F2F2] px-2 py-0.5 text-xs font-semibold capitalize ${style} ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
