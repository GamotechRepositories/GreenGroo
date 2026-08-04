import { Link } from "react-router-dom";
import { cardClass } from "../adminStyles";
import Sparkline from "./Sparkline";
import TrendArrow from "./TrendArrow";
import { formatCurrency, getDayChange, getTrendClass } from "./dashboardUtils";

function RevenueCard({
  totalRevenue,
  currentMonth,
  lastMonth,
  monthlyTrend = [],
  loading,
  className = "",
  compact = false,
  to,
}) {
  const change = getDayChange(currentMonth, lastMonth);
  const trendClass = getTrendClass(change);
  const sparkValues = monthlyTrend.slice(-6).map((item) => item.revenue);
  const trendLabel =
    change.direction === "flat" ? "No change vs last month" : `${change.percent}% vs last month`;
  const formattedRevenue = loading ? "—" : formatCurrency(totalRevenue);
  const compactAmountClass =
    formattedRevenue.length >= 13
      ? "text-[10px]"
      : formattedRevenue.length >= 9
        ? "text-xs sm:text-sm"
        : "text-base sm:text-lg";
  const hoverClass = to ? "transition hover:border-neutral-300 hover:shadow-sm" : "";

  const content = compact ? (
    <div className={`${cardClass} h-full p-3 ${hoverClass} ${className}`}>
      <div className="flex h-full items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-[11px] font-medium leading-tight text-neutral-500 sm:text-xs">
            Total Revenue
          </p>
          <p
            className={`mt-1 truncate whitespace-nowrap font-bold leading-none text-neutral-900 ${compactAmountClass}`}
          >
            {formattedRevenue}
          </p>
          {!loading && (
            <p className={`mt-1 flex items-center gap-0.5 text-[10px] font-semibold leading-tight ${trendClass}`}>
              <TrendArrow direction={change.direction} />
              <span className="truncate">{trendLabel}</span>
            </p>
          )}
          {to ? (
            <span className="mt-1 inline-block text-[10px] font-medium text-primary">View All →</span>
          ) : null}
        </div>
      </div>
    </div>
  ) : (
    <div className={`${cardClass} h-full p-3 sm:p-5 ${hoverClass} ${className}`}>
      <div className="flex items-center gap-2 sm:hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium leading-tight text-neutral-500">Total Revenue</p>
          {!loading && (
            <p className={`mt-0.5 flex items-center gap-0.5 text-[9px] font-semibold leading-tight ${trendClass}`}>
              <TrendArrow direction={change.direction} />
              <span>{trendLabel}</span>
            </p>
          )}
        </div>

        <p className="shrink-0 text-lg font-bold text-neutral-900">
          {loading ? "—" : formatCurrency(totalRevenue)}
        </p>
      </div>

      <div className="hidden h-full items-center justify-between gap-4 sm:flex">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 sm:h-12 sm:w-12">
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 sm:text-3xl">
              {loading ? "—" : formatCurrency(totalRevenue)}
            </p>
            {!loading && (
              <p className={`mt-1 flex items-center gap-1 text-xs font-semibold sm:text-sm ${trendClass}`}>
                <TrendArrow direction={change.direction} />
                <span>{trendLabel}</span>
              </p>
            )}
          </div>
        </div>

        {!loading && sparkValues.length > 0 && (
          <Sparkline
            values={sparkValues}
            color="#22c55e"
            height={52}
            showDots
            className="w-24 shrink-0 sm:w-32"
          />
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full min-w-0 cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}

export default RevenueCard;
