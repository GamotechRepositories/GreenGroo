import { Link } from "react-router-dom";
import { useLifetimeOrderSpend } from "../../hooks/queries/useMyOrdersQuery";
import { formatOrderPrice } from "../../utils/orderUtils";

function LifetimeOrderSpend({ compact = false }) {
  const { spent, ready, loggedIn } = useLifetimeOrderSpend();

  if (!loggedIn || !ready) return null;

  const amount = formatOrderPrice(spent, { withDecimals: false });
  const label = `You've ordered ${amount} so far`;

  if (compact) {
    return (
      <Link
        to="/orders"
        title={label}
        aria-label={label}
        className="flex h-10 max-w-[92px] shrink-0 flex-col items-end justify-center pr-0.5 leading-tight"
      >
        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Ordered</span>
        <span className="max-w-full truncate text-[12px] font-extrabold tabular-nums text-[#0C831F]">{amount}</span>
      </Link>
    );
  }

  return (
    <Link
      to="/orders"
      title={label}
      aria-label={label}
      className="flex h-10 shrink-0 flex-col justify-center rounded-xl border border-gray-200/90 bg-white px-3 shadow-2xs transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97]"
    >
      <span className="text-[10px] font-medium leading-none text-gray-500">Ordered so far</span>
      <span className="mt-0.5 text-[13px] font-extrabold leading-tight tabular-nums text-[#0C831F]">{amount}</span>
    </Link>
  );
}

export default LifetimeOrderSpend;
