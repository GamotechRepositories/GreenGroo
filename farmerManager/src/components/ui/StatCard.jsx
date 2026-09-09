import { EXCEL_PANEL } from "../../utils/excelStyles";

function StatCard({ title, value, hint, icon }) {
  return (
    <div className={`${EXCEL_PANEL} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-base text-emerald-700">
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default StatCard;
