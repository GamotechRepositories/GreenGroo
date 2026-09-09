import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_PANEL, EXCEL_PANEL_HEAD } from "../../utils/excelStyles";

export default function MarketPriceChart({ crop }) {
  const [timeframe, setTimeframe] = useState("7D"); // 7D, 1M, 3M
  const [activeGrade, setActiveGrade] = useState("all"); // all, gradeA, gradeB, gradeC, modal
  const [hoverPoint, setHoverPoint] = useState(null);

  if (!crop || !crop.history) {
    return (
      <div className={`${EXCEL_PANEL} p-4 text-center text-xs text-[#6B7280]`}>
        No historical price chart available for this crop.
      </div>
    );
  }

  const historyData = crop.history[timeframe] || crop.history["7D"] || [];
  if (historyData.length === 0) return null;

  // Chart dimensions & scaling
  const width = 640;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Calculate min & max prices for Y-axis scaling
  const allPrices = historyData.flatMap((d) => [d.modal, d.gradeA, d.gradeB, d.gradeC].filter(Boolean));
  const minVal = Math.floor(Math.min(...allPrices) * 0.95 / 50) * 50;
  const maxVal = Math.ceil(Math.max(...allPrices) * 1.05 / 50) * 50;
  const valRange = maxVal - minVal || 1;

  const getX = (index) => paddingLeft + (index / (historyData.length - 1)) * chartW;
  const getY = (val) => height - paddingBottom - ((val - minVal) / valRange) * chartH;

  // Generate SVG path string
  const createPath = (key) => {
    return historyData
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d[key])}`)
      .join(" ");
  };

  // Generate Gradient Area path string
  const createAreaPath = (key) => {
    const linePath = createPath(key);
    const lastX = getX(historyData.length - 1);
    const firstX = getX(0);
    const bottomY = height - paddingBottom;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const modalPath = createPath("modal");
  const modalArea = createAreaPath("modal");
  const gradeAPath = createPath("gradeA");
  const gradeBPath = createPath("gradeB");
  const gradeCPath = createPath("gradeC");

  // Summary statistics in current timeframe
  const latestPrice = historyData[historyData.length - 1]?.modal || crop.modalPrice;
  const firstPrice = historyData[0]?.modal || crop.modalPrice;
  const priceDiff = latestPrice - firstPrice;
  const percentDiff = ((priceDiff / firstPrice) * 100).toFixed(1);
  const isPositive = priceDiff >= 0;

  return (
    <div className={EXCEL_PANEL}>
      <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1F2937]">{crop.cropName} Price Trend & History</span>
          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold ${
            isPositive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? `+${percentDiff}%` : `${percentDiff}%`} ({timeframe})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {["7D", "1M", "3M"].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={timeframe === tf ? EXCEL_BTN_PRIMARY : EXCEL_BTN}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3">
        {/* Controls & Filter Legend */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveGrade("all")}
              className={`flex items-center gap-1.5 font-medium transition ${
                activeGrade === "all" ? "font-bold text-[#217346]" : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#217346]" />
              Modal Avg Rate (₹{latestPrice})
            </button>
            <button
              type="button"
              onClick={() => setActiveGrade("gradeA")}
              className={`flex items-center gap-1.5 font-medium transition ${
                activeGrade === "gradeA" ? "font-bold text-emerald-600" : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Grade A (Export)
            </button>
            <button
              type="button"
              onClick={() => setActiveGrade("gradeB")}
              className={`flex items-center gap-1.5 font-medium transition ${
                activeGrade === "gradeB" ? "font-bold text-amber-600" : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Grade B (Standard)
            </button>
            <button
              type="button"
              onClick={() => setActiveGrade("gradeC")}
              className={`flex items-center gap-1.5 font-medium transition ${
                activeGrade === "gradeC" ? "font-bold text-slate-600" : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              Grade C (Local)
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-500">
            Min: ₹{minVal} | Max: ₹{maxVal} per {crop.unit}
          </span>
        </div>

        {/* Responsive SVG Chart */}
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="modalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#217346" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#217346" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y-Axis Horizontal Grid Lines & Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const val = Math.round(minVal + pct * valRange);
              const y = getY(val);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeDasharray="4,4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-400 text-[9.5px] font-medium"
                  >
                    ₹{val}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Date Labels */}
            {historyData.map((d, i) => {
              const x = getX(i);
              return (
                <text
                  key={i}
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-semibold"
                >
                  {d.date}
                </text>
              );
            })}

            {/* Area Fill for Modal Average */}
            {(activeGrade === "all" || activeGrade === "modal") && (
              <path d={modalArea} fill="url(#modalGradient)" />
            )}

            {/* Grade C Line (Slate) */}
            {(activeGrade === "all" || activeGrade === "gradeC") && (
              <path
                d={gradeCPath}
                fill="none"
                stroke="#94A3B8"
                strokeWidth={activeGrade === "gradeC" ? "2.5" : "1.5"}
                strokeDasharray="4,2"
              />
            )}

            {/* Grade B Line (Amber) */}
            {(activeGrade === "all" || activeGrade === "gradeB") && (
              <path
                d={gradeBPath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={activeGrade === "gradeB" ? "2.5" : "1.8"}
              />
            )}

            {/* Grade A Line (Emerald) */}
            {(activeGrade === "all" || activeGrade === "gradeA") && (
              <path
                d={gradeAPath}
                fill="none"
                stroke="#10B981"
                strokeWidth={activeGrade === "gradeA" ? "3" : "2"}
              />
            )}

            {/* Modal Avg Main Line (Green) */}
            {(activeGrade === "all" || activeGrade === "modal") && (
              <path
                d={modalPath}
                fill="none"
                stroke="#217346"
                strokeWidth="2.5"
              />
            )}

            {/* Interactive Hover Data Points */}
            {historyData.map((d, i) => {
              const cx = getX(i);
              const cy = getY(d.modal);
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoverPoint({ data: d, index: i, x: cx, y: cy })}
                  onMouseLeave={() => setHoverPoint(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hoverPoint?.index === i ? 6 : 4}
                    className="fill-white stroke-[#217346] stroke-[2] transition-all hover:r-6 hover:fill-[#217346]"
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoverPoint ? (
            <div
              className="pointer-events-none absolute z-20 rounded-lg border border-slate-200 bg-slate-900/90 p-2 text-white shadow-lg backdrop-blur-xs transition-all"
              style={{
                left: `${(hoverPoint.x / width) * 100}%`,
                top: `${(hoverPoint.y / height) * 100 - 30}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <p className="text-[11px] font-bold text-amber-300">{hoverPoint.data.date}</p>
              <div className="mt-1 space-y-0.5 text-[10px]">
                <p className="text-emerald-300 font-semibold">Modal Rate: ₹{hoverPoint.data.modal}/qtl (₹{(hoverPoint.data.modal / 100).toFixed(1)}/kg)</p>
                <p className="text-emerald-400">Grade A: ₹{hoverPoint.data.gradeA}/qtl</p>
                <p className="text-amber-300">Grade B: ₹{hoverPoint.data.gradeB}/qtl</p>
                <p className="text-slate-300">Grade C: ₹{hoverPoint.data.gradeC}/qtl</p>
                <p className="text-slate-400 pt-0.5">Arrivals: {hoverPoint.data.arrival} Quintals</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
