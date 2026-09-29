import { DEPARTMENT_META, FULFILLMENT } from "../../utils/departments";

function ChoiceCard({ selected, title, subtitle, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all ${
        selected
          ? "border-[#0C831F] bg-emerald-50/60 shadow-sm ring-1 ring-emerald-200/50"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-xl">{icon}</span>
        <span
          className={`h-4 w-4 rounded-full border-2 ${
            selected ? "border-[#0C831F] bg-[#0C831F] ring-2 ring-inset ring-white" : "border-slate-300"
          }`}
        />
      </div>
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </button>
  );
}

export function FulfillmentChoice({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <ChoiceCard
        selected={value === FULFILLMENT.DELIVERY}
        icon="🛵"
        title="Home delivery"
        subtitle="Rider brings it to your address"
        onClick={() => onChange(FULFILLMENT.DELIVERY)}
      />
      <ChoiceCard
        selected={value === FULFILLMENT.PICKUP}
        icon="🏪"
        title="Store pickup"
        subtitle="Collect from the dark store · no delivery fee"
        onClick={() => onChange(FULFILLMENT.PICKUP)}
      />
    </div>
  );
}

/** Dark store the customer collects from, with the store manager's number. */
export function DarkStoreCard({ store, loading }) {
  if (loading) {
    return <div className="shimmer-loading h-20 rounded-xl" />;
  }

  if (!store) {
    return (
      <p className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs font-semibold text-orange-800">
        No dark store serves this address yet. Choose a different address to pick up your order.
      </p>
    );
  }

  const distance = Number.isFinite(Number(store.distanceKm))
    ? ` · ${Number(store.distanceKm).toFixed(1)} km away`
    : "";
  const phone = String(store.phone || "").trim();
  const tel = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg">🏪</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500">Pick up from</p>
        <p className="text-sm font-bold text-slate-900">
          {store.storeName}
          <span className="font-medium text-slate-500">{distance}</span>
        </p>
        {store.address ? <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{store.address}</p> : null}
        {phone ? (
          <p className="mt-1.5 text-xs font-bold text-slate-900">Store manager: +91 {phone.replace(/^\+91/, "")}</p>
        ) : null}
      </div>
      {phone ? (
        <a
          href={`tel:${tel}`}
          className="shrink-0 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-[#0C831F] transition hover:bg-emerald-200"
        >
          📞 Call
        </a>
      ) : null}
    </div>
  );
}

export function DepartmentGroupHeader({ department, itemCount, etaText }) {
  const meta = DEPARTMENT_META[department] || DEPARTMENT_META.preorder;
  return (
    <div className={`mb-2 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${meta.tone}`}>
      <span>{meta.icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold">
          {meta.label} · {itemCount} item{itemCount === 1 ? "" : "s"}
        </p>
        <p className="text-[11px] font-medium text-slate-600">{etaText}</p>
      </div>
    </div>
  );
}
