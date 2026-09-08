const STEPS = [
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "DISPATCHED",
  "DRIVER_ARRIVED",
  "ORDER_VERIFIED",
  "QR_VERIFIED",
  "PICKED_UP",
  "IN_TRANSIT",
  "COLLECTION_CENTRE_RECEIVED",
];

const ALIAS = {
  PICKUP_SCHEDULED: "DRIVER_ASSIGNED",
  ARRIVED: "DRIVER_ARRIVED",
  COMPLETED: "PICKED_UP",
  PICKUP_CONFIRMED: "PICKED_UP",
  RECEIVED_AT_COLLECTION_CENTRE: "COLLECTION_CENTRE_RECEIVED",
};

export const PICKUP_STATUS_LABELS = {
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
  COLLECTION_CENTRE_RECEIVED: "At collection centre",
  RECEIVED_AT_COLLECTION_CENTRE: "At collection centre",
};

const LIVE_ALIASES = {
  "Assigned — waiting to leave": "Assigned",
  "Checking the order": "Order checked",
  "QR verified — confirm pickup": "QR verified",
  "On the way to collection centre": "On the way to centre",
  "Delivered at collection centre": "At collection centre",
  Incoming: "On the way to centre",
};

export function pickupStatusLabel(status) {
  const key = String(status || "").trim();
  if (!key) return "";
  if (PICKUP_STATUS_LABELS[key]) return PICKUP_STATUS_LABELS[key];
  if (LIVE_ALIASES[key]) return LIVE_ALIASES[key];
  if (Object.values(PICKUP_STATUS_LABELS).includes(key)) return key;
  return key.replace(/_/g, " ");
}

export function pickupLiveLabel(pickup) {
  if (!pickup) return "";
  const key = String(pickup.status || "").trim();
  if (PICKUP_STATUS_LABELS[key]) return PICKUP_STATUS_LABELS[key];
  return pickupStatusLabel(pickup.liveStatus || pickup.status);
}

export default function PickupTimeline({ status }) {
  const current = ALIAS[status] || status;
  const idx = STEPS.indexOf(current);
  return (
    <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
      {STEPS.map((step, i) => {
        const done = idx >= 0 && i <= idx;
        return (
          <li
            key={step}
            className={`border px-2 py-2 text-center text-[10px] font-semibold leading-tight ${
              done ? "border-[#217346] bg-[#E8F5E9] text-[#217346]" : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            {pickupStatusLabel(step)}
          </li>
        );
      })}
    </ol>
  );
}
