import { EXCEL_PANEL } from "../../utils/excelStyles";

function StatCard({ title, value, hint, icon }) {
  return (
    <div className={`${EXCEL_PANEL} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#6B7280]">{title}</p>
          <p className="mt-1 text-lg font-bold text-[#1F2937]">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-[#6B7280]">{hint}</p> : null}
        </div>
        {icon ? <span className="text-base text-[#217346]">{icon}</span> : null}
      </div>
    </div>
  );
}

export default StatCard;
