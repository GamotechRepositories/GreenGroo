import { EXCEL_PANEL } from "../../utils/excelStyles";

function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className={`${EXCEL_PANEL} flex flex-col items-center justify-center px-5 py-12 text-center`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-lg">🌿</div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
