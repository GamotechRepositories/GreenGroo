import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/api";
import { canTrackOrder } from "../utils/orderTracking";
import { isActiveOrder, isPlacedOrder } from "../utils/orderUtils";

/** Sends "Track my order" links to the newest active order's live tracking, or the order list. */
function TrackLatestOrder() {
  const { user, loading } = useAuth();
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (loading || !user) return undefined;
    let cancelled = false;
    getMyOrders()
      .then(({ data }) => {
        const latest = (data?.data || [])
          .filter((order) => isPlacedOrder(order) && isActiveOrder(order) && canTrackOrder(order))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
        if (!cancelled) setTarget(latest ? `/orders/${latest._id}/track` : "/orders");
      })
      .catch(() => {
        if (!cancelled) setTarget("/orders");
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (!loading && !user) return <Navigate to="/orders" replace />;
  if (target) return <Navigate to={target} replace />;
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-100 border-t-[#0C831F]" />
    </div>
  );
}

export default TrackLatestOrder;
