import { Link } from "react-router-dom";
import { ArrowRight, Store, TrendingUp } from "lucide-react";
import { CROP_MARKET_PRICES } from "../../data/mandiMarketData";
import { EXCEL_BTN, EXCEL_CELL, EXCEL_HEAD, EXCEL_PANEL, EXCEL_PANEL_HEAD, EXCEL_TABLE, EXCEL_WRAP } from "../../utils/excelStyles";

export default function DashboardMarketPricesWidget() {
  return (
    <section className={EXCEL_PANEL}>
      <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-[#217346]" />
          <span className="font-bold text-[#1F2937]">Today's APMC & Mandi Market Prices</span>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
            LIVE APMC RATES
          </span>
        </div>
        <Link to="/farmer/market-prices" className={`${EXCEL_BTN} inline-flex items-center gap-1 font-semibold text-[#217346]`}>
          <span>View All Market Rates</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="p-3 space-y-3">
        {/* Quick Ticker Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {CROP_MARKET_PRICES.slice(0, 5).map((crop) => {
            const isPos = crop.priceChange >= 0;
            return (
              <Link
                key={crop.id}
                to={`/farmer/market-prices?crop=${crop.cropName}`}
                className="group flex flex-col justify-between rounded-lg border border-[#D4D4D4] bg-[#F9F9F9] p-2.5 transition hover:border-[#217346] hover:bg-white hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-bold text-[#1F2937] group-hover:text-[#217346]">
                    {crop.cropName}
                  </span>
                  <span className={`inline-flex items-center text-[10.5px] font-bold ${
                    isPos ? "text-emerald-700" : "text-red-600"
                  }`}>
                    {isPos ? "+" : ""}{crop.priceChange}%
                  </span>
                </div>

                <div className="mt-2">
                  <div className="text-sm font-extrabold text-[#1F2937]">
                    ₹{crop.modalPrice.toLocaleString("en-IN")}{" "}
                    <span className="text-[10px] font-normal text-[#6B7280]">/ qtl</span>
                  </div>
                  <div className="text-[10.5px] font-semibold text-emerald-700">
                    ₹{(crop.modalPrice / 100).toFixed(1)} / kg
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Live APMC Rates Summary Table */}
        <div className={EXCEL_WRAP}>
          <table className={EXCEL_TABLE}>
            <thead>
              <tr>
                <th className={EXCEL_HEAD}>Crop Name</th>
                <th className={EXCEL_HEAD}>Primary APMC Mandi</th>
                <th className={EXCEL_HEAD}>Grade A (Export Rate)</th>
                <th className={EXCEL_HEAD}>Grade B (Standard Rate)</th>
                <th className={EXCEL_HEAD}>Modal Average Price</th>
                <th className={EXCEL_HEAD}>Daily Arrival</th>
                <th className={EXCEL_HEAD}>Action</th>
              </tr>
            </thead>
            <tbody>
              {CROP_MARKET_PRICES.slice(0, 4).map((crop) => (
                <tr key={crop.id} className="hover:bg-[#F2F2F2]">
                  <td className={`${EXCEL_CELL} font-bold text-[#1F2937]`}>
                    <div className="flex items-center gap-2">
                      <img src={crop.image} alt={crop.cropName} className="h-6 w-6 rounded object-cover" />
                      <div>
                        <span>{crop.cropName}</span>
                        <span className="block text-[10px] font-normal text-[#6B7280]">{crop.localName}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`${EXCEL_CELL} text-[#4B5563]`}>Pune / Lasalgaon APMC</td>
                  <td className={`${EXCEL_CELL} font-bold text-emerald-700`}>
                    ₹{crop.grades[0]?.price.toLocaleString("en-IN")} / qtl (₹{crop.grades[0]?.priceKg}/kg)
                  </td>
                  <td className={`${EXCEL_CELL} text-[#1F2937]`}>
                    ₹{crop.grades[1]?.price.toLocaleString("en-IN")} / qtl
                  </td>
                  <td className={`${EXCEL_CELL} font-extrabold text-[#217346]`}>
                    ₹{crop.modalPrice.toLocaleString("en-IN")} / qtl
                  </td>
                  <td className={`${EXCEL_CELL} text-[#6B7280]`}>{crop.dailyArrival} Quintals</td>
                  <td className={EXCEL_CELL}>
                    <Link
                      to={`/farmer/market-prices?crop=${crop.cropName}`}
                      className="text-xs font-semibold text-[#217346] hover:underline"
                    >
                      Compare & Trends →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
