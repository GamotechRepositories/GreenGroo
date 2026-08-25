const STATUS_STYLES = {
  pending: "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  PENDING: "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  SUBMITTED: "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  APPROVED: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  REJECTED: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  VERIFIED: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  Pending: "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  Verified: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  approved: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  rejected: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  not_uploaded: "border-[#D4D4D4] bg-[#F2F2F2] text-[#6B7280]",
  Draft: "border-[#D4D4D4] bg-[#F2F2F2] text-[#6B7280]",
  "Pending Approval": "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  Approved: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  Rejected: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  "Out of Stock": "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  Inactive: "border-[#D4D4D4] bg-[#F2F2F2] text-[#6B7280]",
  New: "border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]",
  Confirmed: "border-[#4F46E5] bg-[#EEF2FF] text-[#4338CA]",
  Processing: "border-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]",
  "Ready for Pickup": "border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]",
  Completed: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  Cancelled: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  Paid: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  Failed: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  "In Stock": "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  "Low Stock": "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
};

function StatusBadge({ status, className = "" }) {
  const key = String(status || "");
  const style = STATUS_STYLES[key] || "border-[#D4D4D4] bg-[#F2F2F2] text-[#374151]";
  const label = key === "not_uploaded" ? "Not Uploaded" : key.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style} ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
