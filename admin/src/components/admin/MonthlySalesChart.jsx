import { useMemo, useState } from "react";
import { cardClass } from "./adminStyles";

const ORDERS_COLOR = "#171717";
const SALES_COLOR = "#ff7a00";

const yearSelectClass =
  "h-9 w-[92px] shrink-0 cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-white bg-[length:12px] bg-[right_10px_center] bg-no-repeat px-3 pr-8 text-sm font-medium text-neutral-800 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatSalesValue(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

function formatOrdersValue(count) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(count) || 0
  );
}

function formatTooltipSales(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getChartMax(peak, isCount = false) {
  if (peak <= 0) return isCount ? 10 : 10000;

  const padded = peak * 1.15;
  if (isCount) {
    return Math.max(Math.ceil(padded / 5) * 5, 5);
  }

  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const normalized = padded / magnitude;

  let nice;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 2.5) nice = 2.5;
  else if (normalized <= 5) nice = 5;
  else nice = 10;

  return nice * magnitude;
}

function MonthlySalesChart({ monthlySales, year, years, onYearChange, loading }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const normalizedData = useMemo(
    () =>
      (monthlySales || []).map((item) => ({
        month: item.month,
        orders: Number(item.orders) || 0,
        revenue: Number(item.revenue) || 0,
      })),
    [monthlySales]
  );

  const ordersMax = useMemo(() => {
    const peak = Math.max(...normalizedData.map((item) => item.orders), 0);
    return getChartMax(peak, true);
  }, [normalizedData]);

  const salesMax = useMemo(() => {
    const peak = Math.max(...normalizedData.map((item) => item.revenue), 0);
    return getChartMax(peak, false);
  }, [normalizedData]);

  const ordersTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, index) => (ordersMax / steps) * index);
  }, [ordersMax]);

  const salesTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, index) => (salesMax / steps) * index);
  }, [salesMax]);

  const padding = { top: 48, right: 64, bottom: 52, left: 48 };
  const width = 920;
  const height = 340;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const slotWidth = chartWidth / 12;
  const groupWidth = slotWidth * 0.72;
  const barWidth = groupWidth / 2 - 3;
  const barRadius = 4;

  const selectChevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`;

  const hoveredItem = hoveredIndex !== null ? normalizedData[hoveredIndex] : null;
  const hoveredTooltipTop = useMemo(() => {
    if (hoveredIndex === null) return padding.top;

    const item = normalizedData[hoveredIndex];
    if (!item) return padding.top;

    const ordersBarHeight =
      item.orders > 0 ? Math.max((item.orders / ordersMax) * chartHeight, 4) : 0;
    const salesBarHeight =
      item.revenue > 0 ? Math.max((item.revenue / salesMax) * chartHeight, 4) : 0;
    const tallestBar = Math.max(ordersBarHeight, salesBarHeight);

    return padding.top + chartHeight - tallestBar - 12;
  }, [hoveredIndex, normalizedData, ordersMax, salesMax, chartHeight, padding.top]);

  return (
    <div className={`${cardClass} flex h-full w-full min-h-0 flex-col`}>
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Order Statistics</h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            Orders and Sales by Month — {year}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 text-neutral-700">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ORDERS_COLOR }}
              />
              Orders
            </span>
            <span className="inline-flex items-center gap-1.5 text-neutral-700">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: SALES_COLOR }}
              />
              Sales
            </span>
          </div>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className={yearSelectClass}
            style={{ backgroundImage: selectChevron }}
            disabled={loading}
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] flex-1 items-center justify-center text-sm text-text-secondary">
          Loading chart...
        </div>
      ) : (
        <div
          className="relative min-h-[300px] flex-1 overflow-x-auto"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full min-w-[700px]"
            role="img"
            aria-label={`Order statistics chart for ${year}`}
          >
            {ordersTicks.map((tick) => {
              const y = padding.top + chartHeight - (tick / ordersMax) * chartHeight;
              return (
                <line
                  key={`grid-${tick}`}
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {ordersTicks.map((tick) => {
              const y = padding.top + chartHeight - (tick / ordersMax) * chartHeight;
              return (
                <text
                  key={`orders-tick-${tick}`}
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={ORDERS_COLOR}
                  fontSize="11"
                  fontWeight="500"
                >
                  {formatOrdersValue(tick)}
                </text>
              );
            })}

            {salesTicks.map((tick) => {
              const y = padding.top + chartHeight - (tick / salesMax) * chartHeight;
              return (
                <text
                  key={`sales-tick-${tick}`}
                  x={width - padding.right + 8}
                  y={y + 4}
                  textAnchor="start"
                  fill={SALES_COLOR}
                  fontSize="11"
                  fontWeight="500"
                >
                  {formatSalesValue(tick)}
                </text>
              );
            })}

            <text
              x={padding.left - 8}
              y={padding.top - 18}
              textAnchor="end"
              fill={ORDERS_COLOR}
              fontSize="11"
              fontWeight="600"
            >
              Orders
            </text>
            <text
              x={width - padding.right + 8}
              y={padding.top - 18}
              textAnchor="start"
              fill={SALES_COLOR}
              fontSize="11"
              fontWeight="600"
            >
              Sales
            </text>

            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={width - padding.right}
              y2={padding.top + chartHeight}
              stroke="#d1d5db"
              strokeWidth="1"
            />

            {hoveredIndex !== null && (
              <rect
                x={padding.left + hoveredIndex * slotWidth}
                y={padding.top}
                width={slotWidth}
                height={chartHeight}
                fill="rgba(255, 122, 0, 0.1)"
              />
            )}

            {normalizedData.map((item, index) => {
              const groupX = padding.left + index * slotWidth + (slotWidth - groupWidth) / 2;
              const ordersBarHeight =
                item.orders > 0
                  ? Math.max((item.orders / ordersMax) * chartHeight, 4)
                  : 0;
              const salesBarHeight =
                item.revenue > 0
                  ? Math.max((item.revenue / salesMax) * chartHeight, 4)
                  : 0;
              const ordersX = groupX;
              const salesX = groupX + barWidth + 6;
              const ordersY = padding.top + chartHeight - ordersBarHeight;
              const salesY = padding.top + chartHeight - salesBarHeight;
              const labelX = groupX + groupWidth / 2;

              return (
                <g key={item.month}>
                  <text
                    x={labelX}
                    y={padding.top + chartHeight + 18}
                    textAnchor="middle"
                    fill="#6b7280"
                    fontSize="11"
                    fontWeight="500"
                    transform={`rotate(-20, ${labelX}, ${padding.top + chartHeight + 18})`}
                  >
                    {MONTH_LABELS[index]}
                  </text>

                  {ordersBarHeight > 0 && (
                    <rect
                      x={ordersX}
                      y={ordersY}
                      width={barWidth}
                      height={ordersBarHeight}
                      rx={barRadius}
                      ry={barRadius}
                      fill={ORDERS_COLOR}
                    />
                  )}

                  {salesBarHeight > 0 && (
                    <rect
                      x={salesX}
                      y={salesY}
                      width={barWidth}
                      height={salesBarHeight}
                      rx={barRadius}
                      ry={barRadius}
                      fill={SALES_COLOR}
                    />
                  )}
                </g>
              );
            })}

            {normalizedData.map((_, index) => (
              <rect
                key={`hover-${index}`}
                x={padding.left + index * slotWidth}
                y={padding.top}
                width={slotWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
              />
            ))}
          </svg>

          {hoveredItem && hoveredIndex !== null && (
            <div
              className="pointer-events-none absolute z-10 min-w-[148px] rounded-lg border border-neutral-200 bg-white px-3 py-2.5 shadow-lg"
              style={{
                left: `${((padding.left + hoveredIndex * slotWidth + slotWidth / 2) / width) * 100}%`,
                top: `${(hoveredTooltipTop / height) * 100}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <p className="mb-1.5 text-sm font-semibold text-neutral-900">
                {MONTH_LABELS[hoveredIndex]}
              </p>
              <p className="text-xs text-neutral-600">
                orders : {formatOrdersValue(hoveredItem.orders)}
              </p>
              <p className="text-xs text-neutral-600">
                sales : {formatTooltipSales(hoveredItem.revenue)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MonthlySalesChart;
