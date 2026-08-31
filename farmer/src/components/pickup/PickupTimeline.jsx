const STEPS = [
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "DISPATCHED",
  "DRIVER_ARRIVED",
  "ORDER_VERIFIED",
  "QR_VERIFIED",
  "PICKED_UP",
  "IN_TRANSIT",
];

const ALIAS = {
  PICKUP_SCHEDULED: "DRIVER_ASSIGNED",
  ARRIVED: "DRIVER_ARRIVED",
  COMPLETED: "PICKED_UP",
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
  IN_TRANSIT: "On the way to centre",
  COLLECTION_CENTRE_RECEIVED: "At collection centre",
  RECEIVED_AT_COLLECTION_CENTRE: "At collection centre",
};

export function pickupStatusLabel(status) {
  const key = String(status || "");
  return PICKUP_STATUS_LABELS[key] || key.replace(/_/g, " ");
}

export default function PickupTimeline({ status }) {
  const current = ALIAS[status] || status;
  const idx = STEPS.indexOf(current);
  return (
    <ol className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
      {STEPS.map((step, i) => {
        const done = idx >= 0 && i <= idx;
        return (
          <li
            key={step}
            className={`rounded-xl border px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide ${
              done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {pickupStatusLabel(step)}
          </li>
        );
      })}
    </ol>
  );
}
