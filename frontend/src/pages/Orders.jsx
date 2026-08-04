import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/api";
import BlinkitOrderCard from "../components/orders/BlinkitOrderCard";
import DesktopOrderCard from "../components/orders/DesktopOrderCard";
import { OrdersDesktopHeader } from "../components/orders/OrdersDesktopHeader";
import { filterOrders, isPlacedOrder } from "../utils/orderUtils";

function StateCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)] sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="space-y-3 pt-1 lg:hidden">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-44 animate-pulse rounded-xl bg-white" />
      ))}
    </div>
  );
}

function DesktopSkeleton() {
  return (
    <div className="hidden space-y-4 lg:block">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-56 animate-pulse rounded-xl bg-white" />
      ))}
    </div>
  );
}

function Orders() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadOrders = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setOrders([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await getMyOrders();
      setOrders((data?.data || []).filter(isPlacedOrder));
    } catch {
      setOrders([]);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, location.key]);

  const filteredOrders = useMemo(
    () => filterOrders(orders, { filter, query: search }),
    [orders, filter, search]
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7] px-3 pb-24 pt-3 sm:px-4 lg:px-6 lg:pb-8 lg:pt-6">
      <div className="mx-auto max-w-3xl lg:max-w-6xl">
        {authLoading || (user && loading && orders.length === 0 && !error) ? (
          <>
            <MobileSkeleton />
            <DesktopSkeleton />
          </>
        ) : !user ? (
          <div className="pt-2 lg:pt-0">
            <StateCard className="lg:mx-auto lg:max-w-lg">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-text-muted lg:h-16 lg:w-16">
                  <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-text-primary lg:text-xl">Login to view your orders</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Track orders and reorder your favourite products in one tap.
                </p>
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="mt-5 w-full rounded-lg bg-[#2874F0] px-8 py-3.5 text-sm font-bold text-white transition hover:brightness-110 lg:w-auto"
                >
                  Login / Sign Up
                </button>
              </div>
            </StateCard>
          </div>
        ) : error && orders.length === 0 ? (
          <div className="pt-2 lg:pt-0">
            <StateCard className="lg:mx-auto lg:max-w-lg">
              <div className="text-center">
                <p className="text-sm text-text-secondary">{error}</p>
                <button
                  type="button"
                  onClick={loadOrders}
                  className="mt-5 w-full rounded-lg bg-[#2874F0] px-8 py-3.5 text-sm font-bold text-white transition hover:brightness-110 lg:w-auto"
                >
                  Retry
                </button>
              </div>
            </StateCard>
          </div>
        ) : orders.length === 0 ? (
          <div className="pt-2 lg:pt-0">
            <StateCard className="lg:mx-auto lg:max-w-lg">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-text-primary lg:text-xl">No orders yet</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  You haven&apos;t placed any orders yet. Browse products and checkout to see them here.
                </p>
                <Link
                  to="/product"
                  className="mt-5 inline-block w-full rounded-lg bg-primary px-8 py-3.5 text-sm font-bold text-white transition hover:brightness-110 lg:w-auto"
                >
                  Browse Products
                </Link>
              </div>
            </StateCard>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden lg:block">
              <OrdersDesktopHeader
                filter={filter}
                search={search}
                onFilterChange={setFilter}
                onSearchChange={setSearch}
                onClearSearch={() => setSearch("")}
              />

              {filteredOrders.length === 0 ? (
                <StateCard>
                  <div className="text-center py-4">
                    <p className="text-sm text-text-secondary">No orders match your search or filter.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFilter("all");
                        setSearch("");
                      }}
                      className="mt-4 rounded-lg border border-border-light px-5 py-2.5 text-sm font-bold text-text-primary hover:border-[#2874F0] hover:text-[#2874F0]"
                    >
                      Clear filters
                    </button>
                  </div>
                </StateCard>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <DesktopOrderCard key={order._id} order={order} />
                  ))}
                </div>
              )}
            </div>

            {/* Mobile — Blinkit style */}
            <div className="space-y-3 pt-1 lg:hidden">
              {filteredOrders.map((order) => (
                <BlinkitOrderCard key={order._id} order={order} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Orders;
