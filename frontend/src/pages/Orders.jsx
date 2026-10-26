import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, RefreshCw, Search, ShoppingBag, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/api";
import { useLive } from "../realtime/useLive";
import OrderListCard from "../components/orders/OrderListCard";
import { filterOrders, isPlacedOrder, matchesOrderFilter } from "../utils/orderUtils";

const BRAND = "#0C831F";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "In progress" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "return", label: "Returned" },
];

function Header({ count, searchOpen, onToggleSearch }) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="flex h-14 items-center gap-2">
      <button
        type="button"
        onClick={goBack}
        className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100 lg:hidden"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-[17px] font-bold leading-tight text-slate-900 lg:text-2xl">My Orders</h1>
        {count > 0 ? (
          <p className="text-[11.5px] text-slate-500 lg:text-sm">
            {count} order{count === 1 ? "" : "s"} placed
          </p>
        ) : null}
      </div>
      {count > 0 ? (
        <button
          type="button"
          onClick={onToggleSearch}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            searchOpen ? "bg-emerald-50 text-[#0C831F]" : "text-slate-700 hover:bg-slate-100"
          }`}
          aria-label={searchOpen ? "Close search" : "Search orders"}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-[19px] w-[19px]" />}
        </button>
      ) : null}
    </div>
  );
}

function FilterChips({ value, counts, onChange }) {
  return (
    <div className="hide-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-2.5 sm:mx-0 sm:px-0">
      {FILTERS.map((item) => {
        const selected = value === item.id;
        const count = counts[item.id] ?? 0;
        if (item.id !== "all" && item.id !== "active" && count === 0) return null;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold transition ${
              selected
                ? "bg-[#0C831F] text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300"
            }`}
          >
            {item.label}
            <span
              className={`rounded-full px-1.5 text-[10.5px] font-bold tabular-nums ${
                selected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function OrderGrid({ orders }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
      {orders.map((order) => (
        <OrderListCard key={order._id} order={order} />
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="rounded-2xl bg-white p-3.5 ring-1 ring-slate-200/70">
          <div className="flex gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-2/5 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {[0, 1, 2].map((thumb) => (
              <div key={thumb} className="h-12 w-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StateCard({ icon: Icon, title, text, action }) {
  return (
    <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-white px-6 py-8 text-center ring-1 ring-slate-200/70">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#0C831F]">
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{text}</p>
      {action}
    </div>
  );
}

const primaryButton =
  "mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition active:scale-[0.99] sm:w-auto";

function Orders() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      setError("");
      return;
    }

    if (!silent) setLoading(true);
    setError("");
    try {
      const { data } = await getMyOrders();
      setOrders(
        (data?.data || [])
          .filter(isPlacedOrder)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      );
    } catch {
      if (!silent) setOrders([]);
      setError("We couldn't load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useLive(loadOrders, [loadOrders, location.key]);

  const counts = useMemo(() => {
    const result = {};
    FILTERS.forEach(({ id }) => {
      result[id] = orders.filter((order) => matchesOrderFilter(order, id)).length;
    });
    return result;
  }, [orders]);

  const filteredOrders = useMemo(
    () => filterOrders(orders, { filter, query: search }),
    [orders, filter, search]
  );

  const toggleSearch = () => {
    if (searchOpen) {
      setSearch("");
      setSearchOpen(false);
      return;
    }
    setSearchOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  const showSkeleton = authLoading || (user && loading && orders.length === 0 && !error);
  const hasOrders = Boolean(user) && orders.length > 0;

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#F3F5F9] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white lg:static lg:border-0 lg:bg-transparent">
        <div className="mx-auto max-w-5xl px-3 sm:px-4 lg:pt-4">
          <Header count={hasOrders ? orders.length : 0} searchOpen={searchOpen} onToggleSearch={toggleSearch} />

          {hasOrders && searchOpen ? (
            <div className="relative pb-2.5">
              <Search className="pointer-events-none absolute left-3 top-[9px] h-4 w-4 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by order ID or product"
                className="h-9 w-full rounded-[10px] bg-slate-100 pl-9 pr-3 text-[13px] text-slate-900 outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-white focus:ring-[#0C831F]/40"
              />
            </div>
          ) : null}

          {hasOrders ? <FilterChips value={filter} counts={counts} onChange={setFilter} /> : null}
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-5xl px-3 pb-6 pt-3 sm:px-4 lg:pb-10">
        {showSkeleton ? (
          <Skeleton />
        ) : !user ? (
          <StateCard
            icon={Lock}
            title="Log in to see your orders"
            text="Track deliveries, download invoices and reorder your favourites in one tap."
            action={
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className={primaryButton}
                style={{ backgroundColor: BRAND }}
              >
                Log in / Sign up
              </button>
            }
          />
        ) : error && orders.length === 0 ? (
          <StateCard
            icon={RefreshCw}
            title="Something went wrong"
            text={error}
            action={
              <button
                type="button"
                onClick={() => loadOrders()}
                className={primaryButton}
                style={{ backgroundColor: BRAND }}
              >
                Try again
              </button>
            }
          />
        ) : orders.length === 0 ? (
          <StateCard
            icon={ShoppingBag}
            title="No orders yet"
            text="Your orders will show up here once you place one."
            action={
              <Link to="/" className={primaryButton} style={{ backgroundColor: BRAND }}>
                Start shopping
              </Link>
            }
          />
        ) : filteredOrders.length === 0 ? (
          <StateCard
            icon={Search}
            title="No matching orders"
            text={search.trim() ? `Nothing found for "${search.trim()}".` : "No orders in this category yet."}
            action={
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setSearch("");
                }}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-bold text-[#0C831F] ring-1 ring-emerald-200 transition hover:bg-emerald-50"
              >
                Show all orders
              </button>
            }
          />
        ) : (
          <OrderGrid orders={filteredOrders} />
        )}
      </main>
    </div>
  );
}

export default Orders;
