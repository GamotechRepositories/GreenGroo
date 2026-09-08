import { pickupStatusLabel, PICKUP_STATUS_LABELS } from "../pickup/PickupTimeline";

const PICKUP_KEYS = new Set(Object.keys(PICKUP_STATUS_LABELS));
const PICKUP_LABELS = new Set(Object.values(PICKUP_STATUS_LABELS));

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
  "Ready for Harvest": "border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]",
  "READY FOR HARVEST": "border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]",
  READY_FOR_HARVEST: "border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]",
  Growing: "border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]",
  Planned: "border-[#4F46E5] bg-[#EEF2FF] text-[#4338CA]",
  Harvested: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  Completed: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  Cancelled: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  Paid: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  Failed: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  "In Stock": "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  "Low Stock": "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  Active: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  Paused: "border-[#D4D4D4] bg-[#F2F2F2] text-[#6B7280]",
  PENDING_APPROVAL: "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  NEW: "border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]",
  ACCEPTED: "border-[#4F46E5] bg-[#EEF2FF] text-[#4338CA]",
  PREPARING: "border-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]",
  PACKING: "border-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]",
  DISPATCHED: "border-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]",
  ORDER_VERIFIED: "border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]",
  ARRIVED: "border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]",
  READY_FOR_PICKUP: "border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]",
  "Ready for Pickup": "border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]",
  PICKUP_SCHEDULED: "border-[#4F46E5] bg-[#EEF2FF] text-[#4338CA]",
  DRIVER_ASSIGNED: "border-[#4F46E5] bg-[#EEF2FF] text-[#4338CA]",
  DRIVER_ARRIVED: "border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]",
  QR_VERIFIED: "border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]",
  PICKUP_CONFIRMED: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  PICKED_UP: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  COMPLETED: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  IN_TRANSIT: "border-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]",
  ARRIVED_AT_CENTRE: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  COLLECTION_CENTRE_RECEIVED: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  RECEIVED_AT_COLLECTION_CENTRE: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  ARRIVED: "border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]",
  UNLOADING: "border-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]",
  WEIGHT_CHECK: "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  RECEIVED: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  QUALITY_PENDING: "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  INSPECTION: "border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]",
  GRADING: "border-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]",
  GRADE_CONFIRMED: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  ORDER_COMPLETED: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  COMPLETED: "border-[#217346] bg-[#E8F5E9] text-[#217346]",
  REJECTED: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  CANCELLED: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
  NOT_STARTED: "border-[#D4D4D4] bg-[#F2F2F2] text-[#6B7280]",
};

const STATUS_LABELS = {
  NEW: "New",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready for pickup",
  DRIVER_ASSIGNED: "Assigned",
  PICKUP_SCHEDULED: "Assigned",
  DISPATCHED: "On the way to farm",
  DRIVER_ARRIVED: "Reached the farm",
  ARRIVED: "Reached the farm",
  ORDER_VERIFIED: "Order checked",
  QR_VERIFIED: "QR verified",
  PICKED_UP: "Pickup confirmed",
  PICKUP_CONFIRMED: "Pickup confirmed",
  IN_TRANSIT: "On the way to centre",
  ARRIVED_AT_CENTRE: "At collection centre",
  COLLECTION_CENTRE_RECEIVED: "Received",
  RECEIVED_AT_COLLECTION_CENTRE: "Received",
  QUALITY_PENDING: "Pending",
  QUALITY_CHECK: "Quality Check",
  INSPECTION: "Quality Check",
  GRADING: "Grading",
  GRADE_CONFIRMED: "Grading Completed",
  ORDER_COMPLETED: "Grading Completed",
};

const QUALITY_KEYS = new Set([
  "QUALITY_PENDING",
  "QUALITY_CHECK",
  "INSPECTION",
  "GRADING",
  "GRADE_CONFIRMED",
  "ORDER_COMPLETED",
]);

function StatusBadge({ status, className = "" }) {
  const key = String(status || "");
  const pickupLabel = pickupStatusLabel(key);
  const isPickup = PICKUP_KEYS.has(key) || PICKUP_LABELS.has(pickupLabel);
  const isQuality = QUALITY_KEYS.has(key);
  const style = STATUS_STYLES[key] || (isPickup ? "border-[#217346] bg-[#E8F5E9] text-[#217346]" : "border-[#D4D4D4] bg-[#F2F2F2] text-[#374151]");
  const label =
    key === "not_uploaded"
      ? "Not Uploaded"
      : isPickup
        ? pickupLabel
        : STATUS_LABELS[key] || key.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        isPickup || isQuality ? "normal-case tracking-normal" : "uppercase tracking-wide"
      } ${style} ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
