import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Scale,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Info,
  Filter,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";
import { EXCEL_PANEL } from "../../utils/excelStyles";

const GRADE_COLORS = {
  gradeA: {
    bg: "#10B981", // Emerald 500
    hover: "#059669",
    light: "bg-emerald-50 text-emerald-800 border-emerald-200",
    label: "Grade A (Premium)",
    short: "Grade A",
  },
  gradeB: {
    bg: "#0284C7", // Sky 600
    hover: "#0369A1",
    light: "bg-sky-50 text-sky-800 border-sky-200",
    label: "Grade B (Standard)",
    short: "Grade B",
  },
  gradeC: {
    bg: "#F59E0B", // Amber 500
    hover: "#D97706",
    light: "bg-amber-50 text-amber-800 border-amber-200",
    label: "Grade C (Fair / Commercial)",
    short: "Grade C",
  },
  rejected: {
    bg: "#EF4444", // Red 500
    hover: "#DC2626",
    light: "bg-red-50 text-red-800 border-red-200",
    label: "Rejected / Damaged",
    short: "Rejected",
  },
};

const PRODUCT_PALETTE = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#14B8A6", // Teal
];

function DonutPieChart({ segments = [], total = 0, hoveredKey, onHover, centerContent, size = 180 }) {
  const radius = 54;
  const strokeWidth = 20;
  const hoverStrokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        {/* Background track circle */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />

        {total > 0
          ? segments.map((seg) => {
              if (!(seg.value > 0)) return null;
              const sliceLength = (seg.value / total) * circumference;
              const isHovered = hoveredKey === seg.key;
              const currentOffset = cumulativeOffset;
              cumulativeOffset += sliceLength;

              return (
                <circle
                  key={seg.key}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? hoverStrokeWidth : strokeWidth}
                  strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
                  strokeDashoffset={-currentOffset}
                  className="cursor-pointer transition-all duration-200 ease-out"
                  onMouseEnter={() => onHover(seg)}
                  onMouseLeave={() => onHover(null)}
                />
              );
            })
          : null}
      </svg>

      {/* Center content badge */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
        {centerContent}
      </div>
    </div>
  );
}

export default function QualityGradeRejectionChart({
  grades = {},
  byProduct = [],
  rejectionByProduct = [],
  rejectionReasonsOverall = [],
  qualityPending = 0,
  qualityInProcess = 0,
  qualityCompleted = 0,
}) {
  // View mode: "grade" (Grade-wise) or "rejectionShare" (Product-wise Rejection)
  const [viewMode, setViewMode] = useState("grade");
  // Selected product filter for drill-down: "all" or product name
  const [selectedProduct, setSelectedProduct] = useState("all");
  // Hovered slice state
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Active product data when filtered
  const activeProductData = useMemo(() => {
    if (selectedProduct === "all") return null;
    return byProduct.find((p) => p.productName === selectedProduct) || null;
  }, [selectedProduct, byProduct]);

  // Dynamic Grade stats depending on product filter
  const currentGradeData = useMemo(() => {
    if (activeProductData) {
      const gA = activeProductData.gradeA || 0;
      const gB = activeProductData.gradeB || 0;
      const gC = activeProductData.gradeC || 0;
      const rej = activeProductData.rejected || 0;
      const tot = gA + gB + gC + rej;
      const rate = tot > 0 ? Number(((rej / tot) * 100).toFixed(1)) : 0;
      return {
        gradeA: gA,
        gradeB: gB,
        gradeC: gC,
        rejected: rej,
        total: tot,
        rejectionRate: rate,
        unit: activeProductData.unit || "Kg",
      };
    }
    const gA = Number(grades.gradeA || 0);
    const gB = Number(grades.gradeB || 0);
    const gC = Number(grades.gradeC || 0);
    const rej = Number(grades.rejected || 0);
    const tot = Number(grades.total || gA + gB + gC + rej);
    const rate = Number(grades.rejectionRate ?? (tot > 0 ? ((rej / tot) * 100).toFixed(1) : 0));
    return {
      gradeA: gA,
      gradeB: gB,
      gradeC: gC,
      rejected: rej,
      total: tot,
      rejectionRate: rate,
      unit: "Kg",
    };
  }, [activeProductData, grades]);

  // Segments for Grade-wise Pie Chart
  const gradeSegments = useMemo(() => {
    return [
      {
        key: "gradeA",
        label: GRADE_COLORS.gradeA.label,
        short: GRADE_COLORS.gradeA.short,
        value: currentGradeData.gradeA,
        color: GRADE_COLORS.gradeA.bg,
      },
      {
        key: "gradeB",
        label: GRADE_COLORS.gradeB.label,
        short: GRADE_COLORS.gradeB.short,
        value: currentGradeData.gradeB,
        color: GRADE_COLORS.gradeB.bg,
      },
      {
        key: "gradeC",
        label: GRADE_COLORS.gradeC.label,
        short: GRADE_COLORS.gradeC.short,
        value: currentGradeData.gradeC,
        color: GRADE_COLORS.gradeC.bg,
      },
      {
        key: "rejected",
        label: GRADE_COLORS.rejected.label,
        short: GRADE_COLORS.rejected.short,
        value: currentGradeData.rejected,
        color: GRADE_COLORS.rejected.bg,
      },
    ];
  }, [currentGradeData]);

  // Segments for Product-wise Rejection Share Chart
  const productRejectionSegments = useMemo(() => {
    return rejectionByProduct.map((item, idx) => ({
      key: item.productName,
      label: item.productName,
      short: item.productName,
      value: item.rejected,
      rate: item.rejectionRate,
      share: item.shareOfRejections,
      unit: item.unit || "Kg",
      color: PRODUCT_PALETTE[idx % PRODUCT_PALETTE.length],
    }));
  }, [rejectionByProduct]);

  // Total for product rejection share
  const totalRejectionsAll = useMemo(() => {
    return productRejectionSegments.reduce((sum, s) => sum + s.value, 0);
  }, [productRejectionSegments]);

  // Active chart segments based on viewMode
  const activeSegments = viewMode === "grade" ? gradeSegments : productRejectionSegments;
  const activeTotal = viewMode === "grade" ? currentGradeData.total : totalRejectionsAll;

  // Rejection severity styling
  const rejectionRate = currentGradeData.rejectionRate;
  const rateSeverity =
    rejectionRate === 0
      ? { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "0% Rejection (Flawless)" }
      : rejectionRate <= 3
      ? { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", label: `${rejectionRate}% (Low Rejection)` }
      : rejectionRate <= 8
      ? { bg: "bg-amber-50 text-amber-800 border-amber-200", label: `${rejectionRate}% (Moderate Rejection)` }
      : { bg: "bg-red-50 text-red-800 border-red-200", label: `${rejectionRate}% (High Rejection)` };

  // Rejection reasons list
  const activeReasons = useMemo(() => {
    if (activeProductData && activeProductData.rejectionReasons) {
      return Object.entries(activeProductData.rejectionReasons).map(([r, q]) => ({
        reason: r,
        quantity: q,
        percentage:
          activeProductData.rejected > 0
            ? Math.round((q / activeProductData.rejected) * 100)
            : 0,
      }));
    }
    return rejectionReasonsOverall;
  }, [activeProductData, rejectionReasonsOverall]);

  return (
    <div className={`${EXCEL_PANEL} p-4 sm:p-5 flex flex-col justify-between`}>
      <div>
        {/* Top Header Strip with Rejection Rate Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shadow-2xs">
              <Scale className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Quality, Grade & Rejection Rate</h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${rateSeverity.bg}`}
                >
                  <TrendingDown className="h-3 w-3" />
                  {rateSeverity.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Product-wise and grade-wise breakdown with precise rejection tracking
              </p>
            </div>
          </div>
          <Link
            to="/vendor/quality/pending"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            <span>Inspect Quality</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Controls Toolbar: View Mode Tabs + Product Filter Dropdown */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50/80 p-2 border border-slate-200/70">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("grade")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "grade"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <PieChart className="h-3.5 w-3.5 text-emerald-600" />
              <span>Grade-wise Pie</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("rejectionShare")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "rejectionShare"
                  ? "bg-white text-red-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span>Product Rejection Share ({totalRejectionsAll} Kg)</span>
            </button>
          </div>

          {/* Product Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                if (viewMode === "rejectionShare" && e.target.value !== "all") {
                  setViewMode("grade");
                }
              }}
              className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600"
            >
              <option value="all">All Products (Combined)</option>
              {byProduct.map((p) => (
                <option key={p.productName} value={p.productName}>
                  {p.productName} ({p.rejectionRate}% Rejection · {p.total} {p.unit || "Kg"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Chart + Legend Section */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Interactive SVG Pie/Donut Chart */}
          <DonutPieChart
            segments={activeSegments}
            total={activeTotal}
            hoveredKey={hoveredSlice?.key}
            onHover={setHoveredSlice}
            size={180}
            centerContent={
              hoveredSlice ? (
                <div>
                  <span className="block text-[10px] font-semibold text-slate-500 truncate max-w-[100px]">
                    {hoveredSlice.short || hoveredSlice.label}
                  </span>
                  <span className="text-base font-extrabold text-slate-900 tabular-nums">
                    {hoveredSlice.value.toLocaleString("en-IN")}{" "}
                    <span className="text-[10px] font-normal text-slate-500">{currentGradeData.unit}</span>
                  </span>
                  <span className="block text-[11px] font-bold text-emerald-700 tabular-nums">
                    {activeTotal > 0 ? Math.round((hoveredSlice.value / activeTotal) * 100) : 0}%
                  </span>
                </div>
              ) : viewMode === "grade" ? (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rejection Rate
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                    {currentGradeData.rejectionRate}%
                  </span>
                  <span className="block text-[10px] font-semibold text-red-600 tabular-nums">
                    {currentGradeData.rejected.toLocaleString("en-IN")} {currentGradeData.unit} Rej
                  </span>
                </div>
              ) : (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Rejected
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-red-600 tabular-nums">
                    {totalRejectionsAll.toLocaleString("en-IN")}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-500">
                    {productRejectionSegments.length} Products
                  </span>
                </div>
              )
            }
          />

          {/* Dynamic Legend and Metrics List */}
          <div className="min-w-0 flex-1 space-y-2">
            {viewMode === "grade" ? (
              // Grade-wise Legend
              gradeSegments.map((seg) => {
                const pct = activeTotal > 0 ? Math.round((seg.value / activeTotal) * 100) : 0;
                const isHovered = hoveredSlice?.key === seg.key;
                return (
                  <div
                    key={seg.key}
                    onMouseEnter={() => setHoveredSlice(seg)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`rounded-lg p-1.5 transition ${
                      isHovered ? "bg-slate-100/90 shadow-2xs" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="truncate">{seg.label}</span>
                      </span>
                      <span className="ml-2 shrink-0 tabular-nums text-slate-700 font-bold">
                        {seg.value.toLocaleString("en-IN")} {currentGradeData.unit}{" "}
                        <span className="text-[11px] font-normal text-slate-500">({pct}%)</span>
                      </span>
                    </div>
                    {/* Micro Progress Bar */}
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: seg.color }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              // Product Rejection Share Legend
              productRejectionSegments.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-1" />
                  No rejections recorded across products!
                </div>
              ) : (
                productRejectionSegments.map((seg) => {
                  const isHovered = hoveredSlice?.key === seg.key;
                  return (
                    <div
                      key={seg.key}
                      onMouseEnter={() => setHoveredSlice(seg)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => {
                        setSelectedProduct(seg.key);
                        setViewMode("grade");
                      }}
                      className={`cursor-pointer rounded-lg p-1.5 transition ${
                        isHovered ? "bg-slate-100/90 shadow-2xs" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                          <span className="truncate">{seg.label}</span>
                        </span>
                        <span className="ml-2 shrink-0 tabular-nums text-slate-700 font-bold">
                          {seg.value.toLocaleString("en-IN")} {seg.unit}{" "}
                          <span className="text-[11px] font-normal text-slate-500">
                            ({seg.share}% share · {seg.rate}% rate)
                          </span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${seg.share}%`, backgroundColor: seg.color }}
                        />
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Rejection Reasons Section (if any rejections exist) */}
        {activeReasons && activeReasons.length > 0 && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50/40 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-red-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <span>
                  Rejection Root Causes {selectedProduct !== "all" ? `· ${selectedProduct}` : "(All Products)"}:
                </span>
              </span>
              <span className="text-[10px] text-red-700 font-normal">Based on QC inspections</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {activeReasons.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-2xs border border-red-200/60"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="text-slate-800">{item.reason}:</span>
                  <span className="font-bold text-red-700">
                    {item.quantity.toLocaleString("en-IN")} {currentGradeData.unit} ({item.percentage}%)
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Product-wise Comparison Grid (Compact strip for quick drilldown) */}
        {byProduct.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-2">
              <span>Product Rejection Breakdown:</span>
              {selectedProduct !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedProduct("all")}
                  className="text-emerald-700 hover:underline"
                >
                  Reset to All Products
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {byProduct.slice(0, 4).map((p) => {
                const isSelected = selectedProduct === p.productName;
                const isHigh = p.rejectionRate > 5;
                return (
                  <button
                    key={p.productName}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(p.productName);
                      setViewMode("grade");
                    }}
                    className={`flex flex-col justify-between rounded-lg border p-2 text-left transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-bold text-slate-800">{p.productName}</span>
                      <span
                        className={`rounded px-1 py-0.2 text-[9px] font-extrabold ${
                          isHigh ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.rejectionRate}% Rej
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-[10px] text-slate-500">
                      <span>
                        Rej: <strong className="text-red-600">{p.rejected}</strong> {p.unit || "Kg"}
                      </span>
                      <span>
                        Tot: <strong>{p.total}</strong>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Operational Inspection Status Counters */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
        <Link
          to="/vendor/quality/pending"
          className="rounded-xl bg-slate-50 p-2 transition hover:bg-amber-50 hover:border-amber-200"
        >
          <p className="text-[10px] text-slate-500 font-medium">Inspection Queue</p>
          <p className="text-sm font-bold text-slate-800">{qualityPending}</p>
        </Link>
        <Link
          to="/vendor/quality/pending"
          className="rounded-xl bg-slate-50 p-2 transition hover:bg-sky-50 hover:border-sky-200"
        >
          <p className="text-[10px] text-slate-500 font-medium">Grading Stage</p>
          <p className="text-sm font-bold text-slate-800">{qualityInProcess}</p>
        </Link>
        <Link
          to="/vendor/quality/pending"
          className="rounded-xl bg-slate-50 p-2 transition hover:bg-emerald-50 hover:border-emerald-200"
        >
          <p className="text-[10px] text-slate-500 font-medium">Completed QC</p>
          <p className="text-sm font-bold text-emerald-700">{qualityCompleted}</p>
        </Link>
      </div>
    </div>
  );
}
