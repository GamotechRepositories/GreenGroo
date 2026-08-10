const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  not_uploaded: "bg-gray-50 text-gray-600 border-gray-200",
  Draft: "bg-gray-50 text-gray-700 border-gray-200",
  "Pending Approval": "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  "Out of Stock": "bg-orange-50 text-orange-700 border-orange-200",
  Inactive: "bg-slate-50 text-slate-600 border-slate-200",
  New: "bg-sky-50 text-sky-700 border-sky-200",
  Confirmed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Processing: "bg-violet-50 text-violet-700 border-violet-200",
  "Ready for Pickup": "bg-teal-50 text-teal-700 border-teal-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Failed: "bg-red-50 text-red-700 border-red-200",
  "In Stock": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Low Stock": "bg-amber-50 text-amber-700 border-amber-200",
};

function StatusBadge({ status, className = "" }) {
  const key = String(status || "");
  const style = STATUS_STYLES[key] || "bg-gray-50 text-gray-700 border-gray-200";
  const label = key === "not_uploaded" ? "Not Uploaded" : key.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${style} ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
