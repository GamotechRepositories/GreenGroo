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
            className={`rounded-xl border px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide ${
              done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {step.replace(/_/g, " ")}
          </li>
        );
      })}
    </ol>
  );
}
