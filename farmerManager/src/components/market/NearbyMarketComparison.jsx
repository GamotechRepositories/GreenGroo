import { MapPin, Navigation, TrendingUp } from "lucide-react";
import { EXCEL_CELL, EXCEL_HEAD, EXCEL_PANEL, EXCEL_PANEL_HEAD, EXCEL_TABLE, EXCEL_WRAP } from "../../utils/excelStyles";

export default function NearbyMarketComparison({ crop }) {
  if (!crop || !crop.mandis) return null;

  const bestMandi = crop.mandis.find((m) => m.isBest) || crop.mandis[0];

  return (
    <div className={EXCEL_PANEL}>
      <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#217346]" />
          <span className="font-bold text-[#1F2937]">Nearby APMC & Mandi Price Comparison for {crop.cropName}</span>
        </div>
        <span className="text-xs text-[#6B7280]">Comparing rates across nearby Maharashtra Mandis</span>
      </div>

      <div className="p-3">
        {/* Highest Price Highlight Banner */}
        {bestMandi ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-lg shadow-xs">
                ⭐
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Best Paying Mandi Today</span>
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase">
                    Highest Modal Rate
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900">{bestMandi.mandiName}</h3>
                <p className="text-xs text-slate-600">
                  Located approx <strong>{bestMandi.distanceKm} km away</strong> • Range: ₹{bestMandi.minPrice} - ₹{bestMandi.maxPrice}/qtl
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[11px] font-semibold text-slate-500">Highest Modal Rate</span>
                <span className="text-lg font-black text-emerald-700">
                  ₹{bestMandi.modalPrice.toLocaleString("en-IN")} / qtl
                </span>
                <span className="block text-[11px] font-bold text-emerald-800">
                  (+₹{bestMandi.diffModal} / qtl extra profit!)
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Comparison Table */}
        <div className={EXCEL_WRAP}>
          <table className={EXCEL_TABLE}>
            <thead>
              <tr>
                <th className={EXCEL_HEAD}>Mandi / APMC Name</th>
                <th className={EXCEL_HEAD}>Distance</th>
                <th className={EXCEL_HEAD}>Min Price</th>
                <th className={EXCEL_HEAD}>Max Price</th>
                <th className={EXCEL_HEAD}>Today Modal Rate</th>
                <th className={EXCEL_HEAD}>Rate Diff vs Local</th>
                <th className={EXCEL_HEAD}>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {crop.mandis.map((m) => {
                const isPositiveDiff = m.diffModal > 0;
                const isZeroDiff = m.diffModal === 0;

                return (
                  <tr
                    key={m.mandiId}
                    className={`transition-colors ${
                      m.isBest ? "bg-emerald-50/60 font-semibold" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className={`${EXCEL_CELL} font-bold text-[#1F2937]`}>
                      <div className="flex items-center gap-2">
                        <span>{m.mandiName}</span>
                        {m.isBest ? (
                          <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
                            BEST PRICE
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className={`${EXCEL_CELL} text-[#6B7280]`}>
                      <span className="inline-flex items-center gap-1">
                        <Navigation className="h-3 w-3 text-slate-400" />
                        {m.distanceKm} km
                      </span>
                    </td>
                    <td className={`${EXCEL_CELL} text-[#4B5563]`}>₹{m.minPrice.toLocaleString("en-IN")}</td>
                    <td className={`${EXCEL_CELL} text-[#4B5563]`}>₹{m.maxPrice.toLocaleString("en-IN")}</td>
                    <td className={`${EXCEL_CELL} font-extrabold text-[#1F2937]`}>
                      ₹{m.modalPrice.toLocaleString("en-IN")} / qtl
                    </td>
                    <td className={EXCEL_CELL}>
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          isPositiveDiff
                            ? "text-emerald-700"
                            : isZeroDiff
                            ? "text-slate-500"
                            : "text-red-600"
                        }`}
                      >
                        {isPositiveDiff ? <TrendingUp className="h-3 w-3" /> : null}
                        {isPositiveDiff
                          ? `+₹${m.diffModal}`
                          : isZeroDiff
                          ? "Base Local Rate"
                          : `-₹${Math.abs(m.diffModal)}`}
                      </span>
                    </td>
                    <td className={EXCEL_CELL}>
                      {m.isBest ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          Highly Recommended
                        </span>
                      ) : isPositiveDiff ? (
                        <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800">
                          Good Margin
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          Local Market
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
