import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Scale,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Filter,
  Package,
  Users,
  User,
  ArrowRight,
  Phone,
  Sparkles,
  RotateCcw,
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

const CHART_PALETTE = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#10B981", // Emerald
  "#3B82F6", // Blue
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
  byFarmer = [],
  rejectionByProduct = [],
  rejectionByFarmer = [],
  rejectionReasonsOverall = [],
  qualityPending = 0,
  qualityInProcess = 0,
  qualityCompleted = 0,
}) {
  // View mode: "grade" (Grade Distribution) | "product" (Product Rejection & Share) | "farmer" (Farmer Rejection & Share)
  const [viewMode, setViewMode] = useState("grade");
  // Filters
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedFarmer, setSelectedFarmer] = useState("all");
  // Hovered slice state
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Active product / farmer objects
  const activeProductData = useMemo(() => {
    if (selectedProduct === "all") return null;
    return byProduct.find((p) => p.productName === selectedProduct) || null;
  }, [selectedProduct, byProduct]);

  const activeFarmerData = useMemo(() => {
    if (selectedFarmer === "all") return null;
    return byFarmer.find((f) => f.farmerId === selectedFarmer || f.farmerCode === selectedFarmer) || null;
  }, [selectedFarmer, byFarmer]);

  // Dynamic Grade stats depending on active filter
  const currentGradeData = useMemo(() => {
    // If filtered by farmer
    if (activeFarmerData) {
      const gA = activeFarmerData.gradeA || 0;
      const gB = activeFarmerData.gradeB || 0;
      const gC = activeFarmerData.gradeC || 0;
      const rej = activeFarmerData.rejected || 0;
      const tot = gA + gB + gC + rej;
      const rate = tot > 0 ? Number(((rej / tot) * 100).toFixed(1)) : 0;
      return {
        label: `${activeFarmerData.farmerName} (${activeFarmerData.farmerCode})`,
        subLabel: `Farmer Scope · ${activeFarmerData.products?.join(", ") || "All Products"}`,
        gradeA: gA,
        gradeB: gB,
        gradeC: gC,
        rejected: rej,
        total: tot,
        rejectionRate: rate,
        unit: activeFarmerData.unit || "Kg",
      };
    }

    // If filtered by product
    if (activeProductData) {
      const gA = activeProductData.gradeA || 0;
      const gB = activeProductData.gradeB || 0;
      const gC = activeProductData.gradeC || 0;
      const rej = activeProductData.rejected || 0;
      const tot = gA + gB + gC + rej;
      const rate = tot > 0 ? Number(((rej / tot) * 100).toFixed(1)) : 0;
      return {
        label: activeProductData.productName,
        subLabel: `Product Scope · ${activeProductData.farmerCount || 0} Farmer(s)`,
        gradeA: gA,
        gradeB: gB,
        gradeC: gC,
        rejected: rej,
        total: tot,
        rejectionRate: rate,
        unit: activeProductData.unit || "Kg",
      };
    }

    // Overall Vendor Totals
    const gA = Number(grades.gradeA || 0);
    const gB = Number(grades.gradeB || 0);
    const gC = Number(grades.gradeC || 0);
    const rej = Number(grades.rejected || 0);
    const tot = Number(grades.total || gA + gB + gC + rej);
    const rate = Number(grades.rejectionRate ?? (tot > 0 ? ((rej / tot) * 100).toFixed(1) : 0));
    return {
      label: "All Produce & Farmers Combined",
      subLabel: `${byProduct.length} Products · ${byFarmer.length} Farmers`,
      gradeA: gA,
      gradeB: gB,
      gradeC: gC,
      rejected: rej,
      total: tot,
      rejectionRate: rate,
      unit: "Kg",
    };
  }, [activeProductData, activeFarmerData, grades, byProduct.length, byFarmer.length]);

  // 1. Grade-wise Pie Chart Segments
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

  // 2. Product-wise Rejection Segments
  const productRejectionSegments = useMemo(() => {
    return rejectionByProduct.map((item, idx) => ({
      key: item.productName,
      label: item.productName,
      short: item.productName,
      value: item.rejected,
      rate: item.rejectionRate,
      share: item.shareOfRejections,
      unit: item.unit || "Kg",
      color: CHART_PALETTE[idx % CHART_PALETTE.length],
    }));
  }, [rejectionByProduct]);

  // 3. Farmer-wise Rejection Segments
  const farmerRejectionSegments = useMemo(() => {
    return rejectionByFarmer.map((item, idx) => ({
      key: item.farmerId || item.farmerCode,
      label: item.farmerName,
      short: item.farmerName,
      code: item.farmerCode,
      value: item.rejected,
      rate: item.rejectionRate,
      share: item.shareOfRejections,
      unit: item.unit || "Kg",
      color: CHART_PALETTE[idx % CHART_PALETTE.length],
    }));
  }, [rejectionByFarmer]);

  const totalProductRejections = useMemo(() => {
    return productRejectionSegments.reduce((sum, s) => sum + s.value, 0);
  }, [productRejectionSegments]);

  const totalFarmerRejections = useMemo(() => {
    return farmerRejectionSegments.reduce((sum, s) => sum + s.value, 0);
  }, [farmerRejectionSegments]);

  // Active chart segments based on viewMode
  const activeSegments =
    viewMode === "grade"
      ? gradeSegments
      : viewMode === "product"
      ? productRejectionSegments
      : farmerRejectionSegments;

  const activeTotal =
    viewMode === "grade"
      ? currentGradeData.total
      : viewMode === "product"
      ? totalProductRejections
      : totalFarmerRejections;

  // Rejection severity styling
  const rejectionRate = currentGradeData.rejectionRate;
  const rateSeverity =
    rejectionRate === 0
      ? { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "0% Rejection (Flawless)" }
      : rejectionRate <= 2
      ? { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", label: `${rejectionRate}% (Low Rejection)` }
      : rejectionRate <= 5
      ? { bg: "bg-amber-50 text-amber-800 border-amber-200", label: `${rejectionRate}% (Moderate Rejection)` }
      : { bg: "bg-red-50 text-red-800 border-red-200", label: `${rejectionRate}% (High Rejection)` };

  // Rejection reasons list scoped to active filter
  const activeReasons = useMemo(() => {
    if (activeFarmerData && activeFarmerData.rejectionReasons) {
      return Object.entries(activeFarmerData.rejectionReasons).map(([r, q]) => ({
        reason: r,
        quantity: q,
        percentage:
          activeFarmerData.rejected > 0 ? Math.round((q / activeFarmerData.rejected) * 100) : 0,
      }));
    }
    if (activeProductData && activeProductData.rejectionReasons) {
      return Object.entries(activeProductData.rejectionReasons).map(([r, q]) => ({
        reason: r,
        quantity: q,
        percentage:
          activeProductData.rejected > 0 ? Math.round((q / activeProductData.rejected) * 100) : 0,
      }));
    }
    return rejectionReasonsOverall;
  }, [activeFarmerData, activeProductData, rejectionReasonsOverall]);

  const resetFilters = () => {
    setSelectedProduct("all");
    setSelectedFarmer("all");
    setHoveredSlice(null);
  };

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
                Real-time farmer-wise & product-wise grading and rejection tracking
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

        {/* Dimension Tabs: Grade-wise Pie | Product-wise | Farmer-wise */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50/80 p-2 border border-slate-200/70">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setViewMode("grade");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "grade"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <PieChart className="h-3.5 w-3.5 text-emerald-600" />
              <span>Grade Distribution</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("product");
                setSelectedFarmer("all");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "product"
                  ? "bg-white text-sky-800 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Package className="h-3.5 w-3.5 text-sky-600" />
              <span>Product-wise ({byProduct.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("farmer");
                setSelectedProduct("all");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "farmer"
                  ? "bg-white text-purple-800 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-purple-600" />
              <span>Farmer-wise ({byFarmer.length})</span>
            </button>
          </div>

          {/* Quick Active Filter Indicator / Reset */}
          {(selectedProduct !== "all" || selectedFarmer !== "all") && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Dual Filters Row: Filter by Product & Filter by Farmer */}
        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Product Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
            <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Product:</span>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                if (e.target.value !== "all") {
                  setSelectedFarmer("all");
                  setViewMode("grade");
                }
              }}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="all">All Products ({byProduct.length} Items)</option>
              {byProduct.map((p) => (
                <option key={p.productName} value={p.productName}>
                  {p.productName} ({p.rejectionRate}% Rej · {p.total} {p.unit || "Kg"})
                </option>
              ))}
            </select>
          </div>

          {/* Farmer Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Farmer:</span>
            <select
              value={selectedFarmer}
              onChange={(e) => {
                setSelectedFarmer(e.target.value);
                if (e.target.value !== "all") {
                  setSelectedProduct("all");
                  setViewMode("grade");
                }
              }}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="all">All Farmers ({byFarmer.length} Farmers)</option>
              {byFarmer.map((f) => (
                <option key={f.farmerId || f.farmerCode} value={f.farmerId || f.farmerCode}>
                  {f.farmerName} ({f.rejectionRate}% Rej · {f.total} {f.unit || "Kg"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Scope Banner (if drilled down) */}
        {(selectedProduct !== "all" || selectedFarmer !== "all") && (
          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-50/70 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-900">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                Filtered by: <strong>{currentGradeData.label}</strong>{" "}
                <span className="text-emerald-700">({currentGradeData.subLabel})</span>
              </span>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-bold text-emerald-800 hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Main Chart + Dynamic Legend Section */}
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
                  <span className="block text-[10px] font-semibold text-slate-500 truncate max-w-[110px]">
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
              ) : viewMode === "product" ? (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Product Rejections
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-red-600 tabular-nums">
                    {totalProductRejections.toLocaleString("en-IN")}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-500">
                    {productRejectionSegments.length} Products
                  </span>
                </div>
              ) : (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Farmer Rejections
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-purple-700 tabular-nums">
                    {totalFarmerRejections.toLocaleString("en-IN")}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-500">
                    {farmerRejectionSegments.length} Farmers
                  </span>
                </div>
              )
            }
          />

          {/* Dynamic Legend and Metrics List */}
          <div className="min-w-0 flex-1 space-y-1.5">
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
            ) : viewMode === "product" ? (
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
                        setSelectedFarmer("all");
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
            ) : (
              // Farmer Rejection Share Legend
              farmerRejectionSegments.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-1" />
                  No rejections recorded across farmers!
                </div>
              ) : (
                farmerRejectionSegments.map((seg) => {
                  const isHovered = hoveredSlice?.key === seg.key;
                  return (
                    <div
                      key={seg.key}
                      onMouseEnter={() => setHoveredSlice(seg)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => {
                        setSelectedFarmer(seg.key);
                        setSelectedProduct("all");
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
                          <span className="text-[10px] text-slate-400 font-normal">({seg.code})</span>
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

        {/* Rejection Root Causes Section (if any rejections exist) */}
        {activeReasons && activeReasons.length > 0 && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50/40 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-red-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <span>
                  Rejection Root Causes{" "}
                  {selectedFarmer !== "all"
                    ? `· ${currentGradeData.label}`
                    : selectedProduct !== "all"
                    ? `· ${selectedProduct}`
                    : "(All Produce)"}:
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

        {/* ---------------------------------------------------- */}
        {/* PRODUCT-WISE BREAKDOWN GRID */}
        {/* ---------------------------------------------------- */}
        {byProduct.length > 0 && (
          <div className="mt-3.5 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-emerald-600" />
                <span>Product-wise Quality & Rejection Breakdown ({byProduct.length} Items)</span>
              </span>
              {selectedProduct !== "all" && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] text-emerald-700 hover:underline"
                >
                  Show All Products
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {byProduct.map((p) => {
                const isSelected = selectedProduct === p.productName;
                const isHigh = p.rejectionRate > 3;
                return (
                  <button
                    key={p.productName}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(p.productName);
                      setSelectedFarmer("all");
                      setViewMode("grade");
                    }}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 text-left transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="truncate text-xs font-bold text-slate-800">{p.productName}</span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                            isHigh
                              ? "bg-red-100 text-red-800"
                              : p.rejectionRate === 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.rejectionRate}% Rej
                        </span>
                      </div>
                      {p.farmers && p.farmers.length > 0 && (
                        <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-1">
                          Farmers: {p.farmers.join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 border-t border-slate-100 pt-1.5 text-[10px]">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Total Supplied:</span>
                        <strong className="text-slate-800">
                          {p.total.toLocaleString("en-IN")} {p.unit || "Kg"}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Grade A / B / C:</span>
                        <span className="font-semibold text-slate-700">
                          {p.gradeA} / {p.gradeB} / {p.gradeC}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Rejected:</span>
                        <strong className={p.rejected > 0 ? "text-red-600 font-bold" : "text-emerald-700"}>
                          {p.rejected} {p.unit || "Kg"}
                        </strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* FARMER-WISE BREAKDOWN GRID */}
        {/* ---------------------------------------------------- */}
        {byFarmer.length > 0 && (
          <div className="mt-3.5 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-600" />
                <span>Farmer-wise Quality & Rejection Breakdown ({byFarmer.length} Farmers)</span>
              </span>
              {selectedFarmer !== "all" && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] text-emerald-700 hover:underline"
                >
                  Show All Farmers
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {byFarmer.map((f) => {
                const isSelected = selectedFarmer === f.farmerId || selectedFarmer === f.farmerCode;
                const isHigh = f.rejectionRate > 3;
                return (
                  <button
                    key={f.farmerId || f.farmerCode}
                    type="button"
                    onClick={() => {
                      setSelectedFarmer(f.farmerId || f.farmerCode);
                      setSelectedProduct("all");
                      setViewMode("grade");
                    }}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 text-left transition ${
                      isSelected
                        ? "border-purple-600 bg-purple-50/60 ring-1 ring-purple-600 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <span className="truncate text-xs font-bold text-slate-800 block">{f.farmerName}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{f.farmerCode}</span>
                        </div>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                            isHigh
                              ? "bg-red-100 text-red-800"
                              : f.rejectionRate === 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {f.rejectionRate}% Rej
                        </span>
                      </div>
                      {f.products && f.products.length > 0 && (
                        <p className="mt-1 text-[10px] text-slate-500 line-clamp-1">
                          Produce: <strong>{f.products.join(", ")}</strong>
                        </p>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 border-t border-slate-100 pt-1.5 text-[10px]">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Total Produced:</span>
                        <strong className="text-slate-800">
                          {f.total.toLocaleString("en-IN")} {f.unit || "Kg"}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Grade A / B / C:</span>
                        <span className="font-semibold text-slate-700">
                          {f.gradeA} / {f.gradeB} / {f.gradeC}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Rejections:</span>
                        <strong className={f.rejected > 0 ? "text-red-600 font-bold" : "text-emerald-700"}>
                          {f.rejected} {f.unit || "Kg"}
                        </strong>
                      </div>
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
