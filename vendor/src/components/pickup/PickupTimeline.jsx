const STEPS = [
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "DISPATCHED",
  "DRIVER_ARRIVED",
  "ORDER_VERIFIED",
  "QR_VERIFIED",
  "PICKED_UP",
];

const ALIAS = {
  PICKUP_SCHEDULED: "DRIVER_ASSIGNED",
  ARRIVED: "DRIVER_ARRIVED",
  COMPLETED: "PICKED_UP",
};

export default function PickupTimeline({ status }) {
  const current = ALIAS[status] || status;
  const idx = STEPS.indexOf(current);
  return (
    <ol className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {STEPS.map((step, i) => {
        const done = idx >= 0 && i <= idx;
        return (
          <li
            key={step}
            className={`border px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide ${
              done ? "border-[#217346] bg-[#E8F5E9] text-[#217346]" : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            {step.replace(/_/g, " ")}
          </li>
        );
      })}
    </ol>
  );
}
