import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cancelOrder, getOrderById } from "../api/api";
import BlinkitOrderDetail from "../components/orders/BlinkitOrderDetail";
import DesktopOrderDetail from "../components/orders/DesktopOrderDetail";

function OrderDetail() {
  const { id } = useParams();
  const { user, openAuthModal } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getOrderById(id);
        setOrder(data.data);
      } catch {
        setError("Order not found");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [user, id]);

  const handleCancelOrder = async () => {
    if (!order || cancelling || order.status !== "confirm") return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order? This action cannot be undone."
    );
    if (!confirmed) return;

    setCancelling(true);
    setCancelError("");
    try {
      const { data } = await cancelOrder(order._id);
      setOrder(data.data);
    } catch (err) {
      setCancelError(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-white px-4 py-16 text-center lg:bg-[#F4F5F7]">
        <p className="mb-6 text-text-secondary">Please login to view order details.</p>
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="rounded-lg bg-primary px-8 py-3 text-sm font-bold text-white"
        >
          Login / Sign Up
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 lg:bg-[#F4F5F7] lg:px-6 lg:py-6">
        <div className="mx-auto max-w-3xl animate-pulse space-y-4 lg:max-w-6xl">
          <div className="h-8 w-40 rounded bg-mobile-surface lg:h-5" />
          <div className="h-28 rounded-xl bg-mobile-surface lg:h-32" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="h-36 rounded-xl bg-mobile-surface" />
              <div className="h-64 rounded-xl bg-mobile-surface" />
            </div>
            <div className="hidden space-y-4 lg:block">
              <div className="h-48 rounded-xl bg-mobile-surface" />
              <div className="h-40 rounded-xl bg-mobile-surface" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] bg-white px-4 py-16 text-center lg:bg-[#F4F5F7]">
        <p className="mb-6 text-text-secondary">{error || "Order not found"}</p>
        <Link to="/orders" className="text-sm font-semibold text-primary hover:underline">
          ← Back to My Orders
        </Link>
      </div>
    );
  }

  const detailProps = {
    order,
    onCancel: handleCancelOrder,
    cancelling,
    cancelError,
  };

  return (
    <>
      <div className="lg:hidden">
        <BlinkitOrderDetail {...detailProps} />
      </div>
      <div className="hidden lg:block">
        <DesktopOrderDetail {...detailProps} />
      </div>
    </>
  );
}

export default OrderDetail;
