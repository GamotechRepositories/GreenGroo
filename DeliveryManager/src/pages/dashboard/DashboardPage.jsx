import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import { Icon } from "../../components/ui/Icon";

export default function DashboardPage() {
  const { manager } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await managerApi.dashboard();
      if (res.data?.summary) setSummary(res.data.summary);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const kpis = [
    {
      label: "Incoming Orders",
      value: summary?.incomingOrders ?? 0,
      subtext: "Awaiting pack & dispatch",
      to: "/orders",
      urgent: (summary?.incomingOrders ?? 0) > 0,
      icon: "orders",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Riders Online",
      value: `${summary?.ridersOnline ?? 0} / ${summary?.ridersTotal ?? 0}`,
      subtext: "Available for delivery",
      to: "/drivers",
      urgent: false,
      icon: "truck",
      iconBg: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Driver Applications",
      value: summary?.pendingDrivers ?? 0,
      subtext: "Awaiting verification",
      to: "/drivers/pending",
      urgent: (summary?.pendingDrivers ?? 0) > 0,
      icon: "user",
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      label: "Inventory SKUs",
      value: summary?.inventorySkus ?? 0,
      subtext: "Products in store",
      to: "/stock",
      urgent: false,
      icon: "box",
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      label: "Low Stock Items",
      value: summary?.lowStockItems ?? 0,
      subtext: "Items below threshold",
      to: "/stock",
      urgent: (summary?.lowStockItems ?? 0) > 0,
      icon: "clipboard",
      iconBg: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <PageShell>
      {/* Dashboard Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Store Dashboard</h1>
          <p className="text-xs md:text-sm text-slate-500">Live operational overview for {manager?.storeName || "Dark Store"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/orders"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Icon name="orders" size="sm" />
            View Orders {summary?.incomingOrders > 0 && `(${summary.incomingOrders})`}
          </Link>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <Link
              key={kpi.label}
              to={kpi.to}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                    <Icon name={kpi.icon} size="sm" />
                  </div>
                  {kpi.urgent && (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {kpi.label}
                </p>
                <p className="mt-0.5 text-2xl font-extrabold text-slate-900 tracking-tight">
                  {kpi.value}
                </p>
              </div>
              <p className="mt-3 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                {kpi.subtext}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Action Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/orders"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-emerald-50 hover:border-emerald-200 transition group"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Icon name="orders" size="md" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Incoming Orders</p>
            <p className="text-xs text-slate-500 mt-0.5">Pack, dispatch & track orders</p>
          </div>
        </Link>

        <Link
          to="/drivers"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-indigo-50 hover:border-indigo-200 transition group"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Icon name="truck" size="md" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Drivers</p>
            <p className="text-xs text-slate-500 mt-0.5">Online riders & assignments</p>
          </div>
        </Link>

        <Link
          to="/drivers/pending"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-purple-50 hover:border-purple-200 transition group"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
            <Icon name="user" size="md" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Driver Verification</p>
            <p className="text-xs text-slate-500 mt-0.5">Approve new driver applications</p>
          </div>
        </Link>

        <Link
          to="/stock"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-blue-50 hover:border-blue-200 transition group"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Icon name="box" size="md" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Stock Inventory</p>
            <p className="text-xs text-slate-500 mt-0.5">View & manage store stock</p>
          </div>
        </Link>

        <Link
          to="/shifts"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-teal-50 hover:border-teal-200 transition group"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Icon name="calendar" size="md" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Shifts & Slots</p>
            <p className="text-xs text-slate-500 mt-0.5">Manage rider shift schedule</p>
          </div>
        </Link>

        <Link
          to="/alerts"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-rose-50 hover:border-rose-200 transition group"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
            <Icon name="bell" size="md" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Alerts</p>
            <p className="text-xs text-slate-500 mt-0.5">Operational alerts & notifications</p>
          </div>
        </Link>
      </div>
    </PageShell>
  );
}
