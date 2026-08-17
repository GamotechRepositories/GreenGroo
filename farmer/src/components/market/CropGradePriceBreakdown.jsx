import { EXCEL_CELL, EXCEL_HEAD, EXCEL_PANEL, EXCEL_PANEL_HEAD, EXCEL_TABLE, EXCEL_WRAP } from "../../utils/excelStyles";

export default function CropGradePriceBreakdown({ crop }) {
  if (!crop || !crop.grades) return null;

  return (
    <div className={EXCEL_PANEL}>
      <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1F2937]">{crop.cropName} — Grade-wise Price Breakdown</span>
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
            {crop.localName}
          </span>
        </div>
        <span className="text-xs text-[#6B7280]">Unit: Per {crop.unit} (100 Kg)</span>
      </div>

      <div className="p-3">
        <div className={EXCEL_WRAP}>
          <table className={EXCEL_TABLE}>
            <thead>
              <tr>
                <th className={EXCEL_HEAD}>Grade</th>
                <th className={EXCEL_HEAD}>Grade Description</th>
                <th className={EXCEL_HEAD}>Quality & Size Specifications</th>
                <th className={EXCEL_HEAD}>Today Rate (₹/Quintal)</th>
                <th className={EXCEL_HEAD}>Today Rate (₹/Kg)</th>
                <th className={EXCEL_HEAD}>Rate Range (Min - Max)</th>
                <th className={EXCEL_HEAD}>Market Demand</th>
              </tr>
            </thead>
            <tbody>
              {crop.grades.map((g) => (
                <tr key={g.grade} className="hover:bg-slate-50 transition-colors">
                  <td className={`${EXCEL_CELL} font-bold text-[#217346]`}>
                    <span className="inline-flex items-center gap-1">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        g.grade === "Grade A" ? "bg-emerald-600" : g.grade === "Grade B" ? "bg-amber-500" : "bg-slate-400"
                      }`} />
                      {g.grade}
                    </span>
                  </td>
                  <td className={`${EXCEL_CELL} font-semibold text-[#1F2937]`}>{g.name}</td>
                  <td className={`${EXCEL_CELL} text-[#4B5563]`}>{g.specs}</td>
                  <td className={`${EXCEL_CELL} font-bold text-[#1F2937]`}>
                    ₹{g.price.toLocaleString("en-IN")} / qtl
                  </td>
                  <td className={`${EXCEL_CELL} font-bold text-emerald-700`}>
                    ₹{g.priceKg.toFixed(2)} / kg
                  </td>
                  <td className={`${EXCEL_CELL} text-[#6B7280]`}>
                    ₹{g.min.toLocaleString("en-IN")} - ₹{g.max.toLocaleString("en-IN")}
                  </td>
                  <td className={EXCEL_CELL}>
                    <span className="inline-block rounded px-2 py-0.5 text-[11px] font-bold bg-[#E8F5E9] text-[#217346]">
                      {g.demand}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="font-bold text-amber-950">💡 Price Recommendation Tip:</span>
            <span>
              Grade A yields an extra <strong>₹{(crop.grades[0]?.price - crop.grades[1]?.price) || 500}/Quintal</strong> margin over Grade B. Clean and grade crops before bringing to APMC Mandi.
            </span>
          </div>
          <span className="font-bold text-amber-900">Today Mandi Arrival: {crop.dailyArrival} Quintals</span>
        </div>
      </div>
    </div>
  );
}
