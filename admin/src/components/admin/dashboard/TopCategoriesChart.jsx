import { Link } from "react-router-dom";
import { cardClass } from "../adminStyles";
import { formatCompactCurrency, formatCurrency, formatNumber } from "./dashboardUtils";

const CATEGORY_COLORS = ["#ff7a00", "#2563eb", "#16a34a", "#eab308"];

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeDonutSlice(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return "";
  if (sweep >= 359.999) {
    return [
      `M ${cx} ${cy - outerRadius}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${cx - 0.01} ${cy - outerRadius}`,
      `L ${cx - 0.01} ${cy - innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy - innerRadius}`,
      "Z",
    ].join(" ");
  }

  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function buildDonutSegments(categories, total) {
  const visible = categories.filter((item) => (Number(item.value) || 0) > 0);
  const segmentTotal = visible.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const baseTotal = total > 0 ? total : segmentTotal;
  let currentAngle = 0;

  return visible.map((item, index) => {
    const value = Number(item.value) || 0;
    const share = baseTotal > 0 ? value / baseTotal : 0;
    const sweep = share * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    currentAngle = endAngle;

    return {
      ...item,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      percent: item.percent ?? (baseTotal > 0 ? Math.round(share * 100) : 0),
      startAngle,
      endAngle,
    };
  });
}

function TopCategoriesChart({ categories = [], totalSales, loading }) {
  const segmentTotal = categories.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const displayTotal = Number(totalSales) > 0 ? Number(totalSales) : segmentTotal;
  const segments = buildDonutSegments(categories, displayTotal);
  const centerAmount =
    displayTotal >= 100000 ? formatCompactCurrency(displayTotal) : formatCurrency(displayTotal);

  return (
    <div className={`${cardClass} flex h-full w-full min-h-0 flex-col`}>
      <div className="mb-3 flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-neutral-900">Top Categories</h3>
          {!loading && displayTotal > 0 && (
            <p className="mt-0.5 text-xs text-neutral-500">Top 3 + other categories</p>
          )}
        </div>
        <Link
          to="/categories/show"
          className="shrink-0 text-xs font-medium text-primary hover:underline sm:text-sm"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <p className="flex min-h-[300px] flex-1 items-center justify-center text-sm text-neutral-500">
          Loading categories...
        </p>
      ) : categories.length === 0 ? (
        <p className="flex min-h-[300px] flex-1 items-center justify-center text-sm text-neutral-500">
          No category sales yet.
        </p>
      ) : (
        <div className="flex min-h-[300px] flex-1 items-center gap-3 sm:gap-4">
          <div className="relative mx-auto flex h-40 w-40 shrink-0 items-center justify-center sm:h-44 sm:w-44">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle cx="50" cy="50" r="42" fill="#f3f4f6" />
              {segments.map((segment) => {
                const path = describeDonutSlice(
                  50,
                  50,
                  42,
                  27,
                  segment.startAngle,
                  segment.endAngle
                );
                if (!path) return null;

                return (
                  <path
                    key={segment.name}
                    d={path}
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth="0.6"
                  />
                );
              })}
              <circle cx="50" cy="50" r="27" fill="#ffffff" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
              <p className="text-[10px] font-medium text-neutral-500">Total Sales</p>
              <p className="mt-0.5 text-xs font-bold text-neutral-900 sm:text-sm">{centerAmount}</p>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            {segments.map((segment) => (
              <div
                key={segment.name}
                className="flex items-start gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-2 py-2 sm:px-2.5"
              >
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[10px] font-medium leading-snug text-neutral-800 sm:text-[11px]">
                    {segment.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-neutral-600">
                    <span className="font-semibold text-neutral-900">{segment.percent}%</span>
                    <span className="text-neutral-400"> · </span>
                    <span>({formatNumber(segment.units || 0)})</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TopCategoriesChart;
