import { PRE_ORDER_PROGRESS_STEPS } from "../../utils/orderUtils";

const CLOSED_TEXT = {
  rejected: "The store could not accept this pre-order. Any payment will be refunded.",
  cancelled: "This pre-order was cancelled.",
  failed: "Delivery could not be completed.",
};

/** Vertical stepper for a pre-order: vendor confirmed → at dark store → rider → delivered. */
export default function PreOrderProgress({ order, className = "" }) {
  const isPre = Boolean(order?.isPreOrder || order?.preOrderSlot || order?.preOrderProgress);
  const key = order?.preOrderProgress || (isPre ? "awaiting_vendor" : "");
  if (!isPre || !key) return null;

  if (CLOSED_TEXT[key]) {
    return (
      <div className={`rounded-xl border border-red-100 bg-red-50 p-4 ${className}`}>
        <p className="text-sm font-bold text-red-700">{order.preOrderProgressLabel || "Pre-order closed"}</p>
        <p className="mt-1 text-xs text-red-600">{CLOSED_TEXT[key]}</p>
      </div>
    );
  }

  const steps = order.preOrderProgressSteps?.length ? order.preOrderProgressSteps : PRE_ORDER_PROGRESS_STEPS;
  const current = Math.max(0, steps.findIndex((step) => step.key === key));

  return (
    <div className={`rounded-xl border border-emerald-100 bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Pre-order status</p>
        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0a6c38] border border-emerald-200">
          {order.preOrderProgressLabel || steps[current]?.label || "Live Progress"}
        </span>
      </div>
      <ol className="mt-2 space-y-0">
        {steps.map((step, index) => {
          const done = index < current || key === "delivered";
          const active = index === current && key !== "delivered";
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    done
                      ? "bg-emerald-600 text-white"
                      : active
                        ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? "✓" : index + 1}
                </span>
                {index < steps.length - 1 ? (
                  <span className={`my-0.5 w-0.5 flex-1 min-h-[16px] ${done ? "bg-emerald-500" : "bg-slate-200"}`} />
                ) : null}
              </div>
              <div className="pb-3 text-xs">
                <p
                  className={`${
                    active ? "font-bold text-emerald-700" : done ? "font-semibold text-text-primary" : "text-text-muted"
                  }`}
                >
                  {step.label}
                </p>
                {step.subtitle && (active || done) && (
                  <p className="text-[10.5px] text-slate-400 mt-0.5">{step.subtitle}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
