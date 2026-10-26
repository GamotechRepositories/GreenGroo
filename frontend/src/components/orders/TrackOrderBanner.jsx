import { Link } from "react-router-dom";
import { Bike, ChevronRight } from "lucide-react";
import { canTrackOrder } from "../../utils/orderTracking";
import { isActiveOrder } from "../../utils/orderUtils";

function TrackOrderBanner({ order, className = "" }) {
  if (!isActiveOrder(order) || !canTrackOrder(order)) return null;
  return (
    <Link
      to={`/orders/${order._id}/track`}
      className={`flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#0C831F] to-[#15803D] px-4 py-3 text-white shadow-sm transition active:scale-[0.99] ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
        <Bike className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold">Track your order</span>
        <span className="block text-[12px] text-emerald-100">Live status, delivery partner and ETA</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0" />
    </Link>
  );
}

export default TrackOrderBanner;
