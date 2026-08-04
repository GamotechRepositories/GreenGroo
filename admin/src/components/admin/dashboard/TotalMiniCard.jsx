import { Link } from "react-router-dom";
import { cardClass } from "../adminStyles";
import { formatNumber } from "./dashboardUtils";

function TotalMiniCard({ label, value, loading, to, icon: Icon, iconBg, className = "" }) {
  const content = (
    <div
      className={`${cardClass} flex h-full min-w-0 items-start gap-2.5 p-3 ${
        to ? "transition hover:border-neutral-300 hover:shadow-sm" : ""
      } ${className}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-[11px] font-medium leading-tight text-neutral-500 sm:text-xs">
          {label}
        </p>
        <p className="mt-1 text-lg font-bold leading-none text-neutral-900 sm:text-xl">
          {loading ? "—" : formatNumber(value)}
        </p>
        {to ? (
          <span className="mt-1 inline-block text-[10px] font-medium text-primary">
            View All →
          </span>
        ) : null}
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

export default TotalMiniCard;
