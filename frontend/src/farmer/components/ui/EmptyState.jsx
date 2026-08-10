import { EXCEL_PANEL } from "../../utils/excelStyles";

function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className={`${EXCEL_PANEL} flex flex-col items-center justify-center px-4 py-10 text-center`}>
      <h3 className="text-xs font-semibold text-[#1F2937]">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-xs text-[#6B7280]">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
