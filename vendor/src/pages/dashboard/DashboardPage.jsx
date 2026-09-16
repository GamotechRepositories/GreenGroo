import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  IdCard,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  ShoppingCart,
  Sparkles,
  Sprout,
  Store,
  Tractor,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { PageShell } from "../../components/layout/ProductManagerLayout";
import { vendorApi } from "../../api/vendorApi";
import { staffApi } from "../../api/staffApi";
import StatusBadge from "../../components/ui/StatusBadge";
import CopyId from "../../components/ui/CopyId";
import { EXCEL_PANEL, EXCEL_HEAD, EXCEL_CELL } from "../../utils/excelStyles";

function formatWhen(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function StatCard({ title, value, hint, icon: Icon, to, color = "text-slate-900", iconBg = "bg-emerald-50 text-emerald-700", border = "border-slate-200/80" }) {
  const content = (
    <div className={`group relative h-full rounded-2xl border ${border} bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className={`mt-1.5 truncate text-2xl font-bold tracking-tight sm:text-3xl ${color}`}>{value ?? "—"}</p>
          {hint ? <p className="mt-1 truncate text-xs text-slate-500">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg} shadow-inner transition-transform group-hover:scale-105`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
        ) : null}
      </div>
      {to ? (
        <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 opacity-80 group-hover:opacity-100">
          <span>Manage</span>
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      ) : null}
    </div>
  );

  return to ? <Link to={to} className="block min-w-0">{content}</Link> : content;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadAll = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [dashRes, reqRes] = await Promise.all([
        vendorApi.getDashboard().catch(() => ({ data: {} })),
        staffApi.inventoryRequests().catch(() => ({ data: { requests: [] } })),
      ]);
      setData(dashRes.data || {});
      setRequests(reqRes.data?.requests || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll(false);
    const timer = window.setInterval(() => loadAll(true), 12000);
    return () => window.clearInterval(timer);
  }, [loadAll]);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequestsCount = requests.filter((r) => r.status === "approved").length;

  const reviewRestock = async (requestId, decision) => {
    setBusyId(`${requestId}-${decision}`);
    try {
      const res = await staffApi.reviewInventoryRequest(requestId, { decision });
      setToast(res.data?.message || `Request ${decision}`);
      await loadAll(true);
    } catch (err) {
      setToast(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId("");
      window.setTimeout(() => setToast(""), 4000);
    }
  };

  const d = data || {};
  const recentOrders = Array.isArray(d.recentOrders) ? d.recentOrders : [];
  const lowStock = Array.isArray(d.lowStockProducts) ? d.lowStockProducts : [];

  // Grade totals calculation
  const gradeA = Number(d.grades?.gradeA || 0);
  const gradeB = Number(d.grades?.gradeB || 0);
  const gradeC = Number(d.grades?.gradeC || 0);
  const rejected = Number(d.grades?.rejected || 0);
  const totalGraded = gradeA + gradeB + gradeC + rejected;
  const gradeAPercent = totalGraded > 0 ? Math.round((gradeA / totalGraded) * 100) : 0;
  const gradeBPercent = totalGraded > 0 ? Math.round((gradeB / totalGraded) * 100) : 0;
  const gradeCPercent = totalGraded > 0 ? Math.round((gradeC / totalGraded) * 100) : 0;
  const rejectedPercent = totalGraded > 0 ? Math.round((rejected / totalGraded) * 100) : 0;

  return (
    <PageShell
      title="Vendor Command Center"
      subtitle="Executive oversight across Farmer Managers, Farmers, Harvest Logistics, Quality Grading, and Dark Store Restock."
    >
      {/* Toast Alert */}
      {toast ? (
        <div className="animate-in fade-in slide-in-from-top-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toast}</span>
          </div>
          <button type="button" onClick={() => setToast("")} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      ) : null}

      {/* Error Alert */}
      {error ? (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError("")} className="text-red-700 hover:text-red-900">
            &times;
          </button>
        </div>
      ) : null}

      {/* Top Action Hub */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-4 text-white shadow-md sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold sm:text-lg">Quick Operations</h2>
          </div>
          <p className="mt-1 text-xs text-emerald-100/90 sm:text-sm">
            Launch new harvest workflows, register farmers, add crops, or dispatch drivers in seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/vendor/all-farmers/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Farmer</span>
          </Link>
          <Link
            to="/vendor/farmer-managers/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-emerald-900 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Manager</span>
          </Link>
          <Link
            to="/vendor/orders/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-emerald-900 sm:text-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Create Order</span>
          </Link>
          <Link
            to="/vendor/crops/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-emerald-900 sm:text-sm"
          >
            <Sprout className="h-4 w-4" />
            <span>Add Crop</span>
          </Link>
          <button
            type="button"
            onClick={() => loadAll(false)}
            disabled={refreshing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {/* Network Domain */}
        <StatCard
          title="Total Farmers"
          value={loading ? "…" : d.totalFarmers ?? 0}
          hint={`${d.activeFarmers ?? 0} active farmers`}
          icon={Tractor}
          to="/vendor/all-farmers"
          color="text-emerald-700"
          iconBg="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Farmer Managers"
          value={loading ? "…" : d.totalManagers ?? 0}
          hint={`${d.activeManagers ?? 0} active managers`}
          icon={Users}
          to="/vendor/farmer-managers"
          color="text-emerald-700"
          iconBg="bg-teal-50 text-teal-700"
        />
        <StatCard
          title="Registered Crops"
          value={loading ? "…" : d.totalCrops ?? 0}
          hint={`${d.harvestReadyCrops ?? 0} ready to harvest`}
          icon={Sprout}
          to="/vendor/crops"
          color="text-emerald-700"
          iconBg="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Product Catalog"
          value={loading ? "…" : d.totalProducts ?? 0}
          hint={`${d.pendingProductApprovals ?? 0} pending review`}
          icon={Package}
          to="/vendor/products"
          color="text-slate-900"
          iconBg="bg-amber-50 text-amber-700"
        />

        {/* Operations & Logistics */}
        <StatCard
          title="Harvest Orders"
          value={loading ? "…" : d.totalOrders ?? 0}
          hint={`${d.pendingOrders ?? 0} pending / in-progress`}
          icon={ShoppingCart}
          to="/vendor/orders"
          color="text-slate-900"
          iconBg="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          title="Live Pickups"
          value={loading ? "…" : d.totalPickups ?? 0}
          hint={`${(d.transitPickups ?? 0) + (d.centrePickups ?? 0)} in transit / at centre`}
          icon={Truck}
          to="/vendor/pickups/all"
          color="text-slate-900"
          iconBg="bg-sky-50 text-sky-700"
        />
        <StatCard
          title="Driver Fleet"
          value={loading ? "…" : d.totalDrivers ?? 0}
          hint={`${d.onDutyDrivers ?? 0} active on route`}
          icon={IdCard}
          to="/vendor/drivers"
          color="text-slate-900"
          iconBg="bg-cyan-50 text-cyan-700"
        />
        <StatCard
          title="Quality & Grading"
          value={loading ? "…" : (d.qualityPending ?? 0) + (d.qualityGrading ?? 0) + (d.qualityInspecting ?? 0)}
          hint={`${d.qualityCompleted ?? 0} completed`}
          icon={BadgeCheck}
          to="/vendor/quality/pending"
          color="text-amber-700"
          iconBg="bg-amber-50 text-amber-700"
        />

        {/* Inventory, Restock & Financials */}
        <StatCard
          title="Warehouse Stock"
          value={loading ? "…" : `${(d.totalInventory ?? 0).toLocaleString("en-IN")} Kg`}
          hint={`${d.lowStockCount ?? 0} low stock alerts`}
          icon={ClipboardList}
          to="/vendor/inventory"
          color="text-emerald-700"
          iconBg="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Dark Store Restock"
          value={loading ? "…" : pendingRequests.length}
          hint={`${approvedRequestsCount} approved requests`}
          icon={Store}
          to="/inventory-requests"
          color={pendingRequests.length > 0 ? "text-amber-600" : "text-slate-900"}
          iconBg="bg-purple-50 text-purple-700"
        />
        <StatCard
          title="Gross Earnings"
          value={loading ? "…" : `₹${(d.totalEarnings ?? 0).toLocaleString("en-IN")}`}
          hint="Total settled revenue"
          icon={Wallet}
          to="/vendor/earnings"
          color="text-emerald-700"
          iconBg="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Pending Settlements"
          value={loading ? "…" : `₹${(d.pendingEarnings ?? 0).toLocaleString("en-IN")}`}
          hint="Pending payments"
          icon={Clock}
          to="/vendor/earnings/payments"
          color="text-amber-600"
          iconBg="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Operational Pipeline Tracker Banner */}
      <div className={`${EXCEL_PANEL} overflow-hidden p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">Agricultural Supply Chain Pipeline</h3>
            <p className="text-xs text-slate-500">Live tracker of orders moving from harvest to dark store dispatch</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live Sync Active
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            to="/vendor/orders"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">1. Harvest Orders</span>
              <ShoppingCart className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{d.pendingOrders ?? 0}</p>
            <p className="text-[10px] text-slate-500">Pending / Confirmed</p>
          </Link>

          <Link
            to="/vendor/pickups/ready"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">2. Ready Pickups</span>
              <Truck className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{d.readyPickups ?? 0}</p>
            <p className="text-[10px] text-slate-500">Awaiting Driver</p>
          </Link>

          <Link
            to="/vendor/pickups/incoming"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">3. In-Transit / Centre</span>
              <RotateCcw className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{(d.transitPickups ?? 0) + (d.centrePickups ?? 0)}</p>
            <p className="text-[10px] text-slate-500">En route / At Hub</p>
          </Link>

          <Link
            to="/vendor/quality/pending"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">4. Quality & Grading</span>
              <BadgeCheck className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{(d.qualityPending ?? 0) + (d.qualityGrading ?? 0)}</p>
            <p className="text-[10px] text-slate-500">Inspection & Grading</p>
          </Link>

          <Link
            to="/vendor/inventory"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">5. Warehouse Stock</span>
              <ClipboardList className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{(d.totalInventory ?? 0).toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-slate-500">Kg Available Stock</p>
          </Link>

          <Link
            to="/inventory-requests"
            className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">6. Dark Store Restock</span>
              <Store className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-amber-700">{pendingRequests.length}</p>
            <p className="text-[10px] text-slate-500">Requests Pending</p>
          </Link>
        </div>
      </div>

      {/* Two Columns: Grade Analytics & Fleet/Logistics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Quality & Grade Analytics */}
        <div className={`${EXCEL_PANEL} p-4 sm:p-5`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Scale className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quality & Grade Distribution</h3>
                <p className="text-xs text-slate-500">Produce graded across Grade A, B, C and Rejected</p>
              </div>
            </div>
            <Link to="/vendor/quality/pending" className="text-xs font-semibold text-emerald-700 hover:underline">
              Inspect Quality &rarr;
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {/* Grade A */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  Grade A (Premium)
                </span>
                <span className="font-semibold text-slate-800">
                  {gradeA.toLocaleString("en-IN")} Kg ({gradeAPercent}%)
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${gradeAPercent}%` }}
                />
              </div>
            </div>

            {/* Grade B */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-blue-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Grade B (Standard)
                </span>
                <span className="font-semibold text-slate-800">
                  {gradeB.toLocaleString("en-IN")} Kg ({gradeBPercent}%)
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${gradeBPercent}%` }}
                />
              </div>
            </div>

            {/* Grade C */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Grade C (Fair / Commercial)
                </span>
                <span className="font-semibold text-slate-800">
                  {gradeC.toLocaleString("en-IN")} Kg ({gradeCPercent}%)
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${gradeCPercent}%` }}
                />
              </div>
            </div>

            {/* Rejected */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-red-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Rejected / Damage
                </span>
                <span className="font-semibold text-slate-800">
                  {rejected.toLocaleString("en-IN")} Kg ({rejectedPercent}%)
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-500"
                  style={{ width: `${rejectedPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div className="rounded-xl bg-slate-50 p-2">
              <p className="text-[10px] text-slate-500">Inspection Queue</p>
              <p className="text-sm font-bold text-slate-800">{d.qualityPending ?? 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <p className="text-[10px] text-slate-500">Grading Stage</p>
              <p className="text-sm font-bold text-slate-800">{d.qualityGrading ?? 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <p className="text-[10px] text-slate-500">Completed</p>
              <p className="text-sm font-bold text-emerald-700">{d.qualityCompleted ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Fleet & Logistics Overview */}
        <div className={`${EXCEL_PANEL} p-4 sm:p-5`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Truck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Fleet & Pickup Logistics</h3>
                <p className="text-xs text-slate-500">Real-time driver dispatch and collection centre status</p>
              </div>
            </div>
            <Link to="/vendor/pickups/all" className="text-xs font-semibold text-emerald-700 hover:underline">
              View All Pickups &rarr;
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              to="/vendor/pickups/ready"
              className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center transition hover:bg-amber-100/60"
            >
              <p className="text-[11px] font-semibold text-amber-800">Ready</p>
              <p className="mt-1 text-2xl font-bold text-amber-900">{d.readyPickups ?? 0}</p>
              <p className="text-[10px] text-amber-700">To Assign</p>
            </Link>

            <Link
              to="/vendor/pickups/assigned"
              className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-center transition hover:bg-sky-100/60"
            >
              <p className="text-[11px] font-semibold text-sky-800">Assigned</p>
              <p className="mt-1 text-2xl font-bold text-sky-900">{d.assignedPickups ?? 0}</p>
              <p className="text-[10px] text-sky-700">To Drivers</p>
            </Link>

            <Link
              to="/vendor/pickups/incoming"
              className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-center transition hover:bg-indigo-100/60"
            >
              <p className="text-[11px] font-semibold text-indigo-800">In Transit</p>
              <p className="mt-1 text-2xl font-bold text-indigo-900">{d.transitPickups ?? 0}</p>
              <p className="text-[10px] text-indigo-700">On The Road</p>
            </Link>

            <Link
              to="/vendor/pickups/centre"
              className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center transition hover:bg-emerald-100/60"
            >
              <p className="text-[11px] font-semibold text-emerald-800">At Centre</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{d.centrePickups ?? 0}</p>
              <p className="text-[10px] text-emerald-700">Receiving</p>
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Driver Fleet Status</span>
              <Link to="/vendor/drivers" className="text-[11px] font-semibold text-emerald-700 hover:underline">
                Manage Drivers &rarr;
              </Link>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Available: {Math.max(0, (d.totalDrivers ?? 0) - (d.onDutyDrivers ?? 0))}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>On Duty: {d.onDutyDrivers ?? 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span>Total Fleet: {d.totalDrivers ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Dark Store Restock Requests & Low Stock Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Dark Store Restock Requests Hub */}
        <div className={`${EXCEL_PANEL} flex flex-col justify-between overflow-hidden`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                  <Store className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">Dark Store Restock Queue</h3>
                  <p className="text-xs text-slate-500">Incoming stock refill requests from delivery managers</p>
                </div>
              </div>
              <Link to="/inventory-requests" className="text-xs font-semibold text-emerald-700 hover:underline">
                View All ({requests.length})
              </Link>
            </div>

            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">Loading restock requests…</p>
              ) : pendingRequests.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/80" />
                  <p className="mt-2 text-sm font-semibold text-slate-800">All caught up!</p>
                  <p className="text-xs text-slate-500">No pending restock requests from dark stores at the moment.</p>
                </div>
              ) : (
                pendingRequests.slice(0, 5).map((request) => (
                  <article key={request.id} className="flex flex-col justify-between gap-2 p-3 sm:p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">{request.productName}</p>
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
                          {request.quantity} {request.unit}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {request.storeName}
                        {request.managerName ? ` · ${request.managerName}` : ""}
                      </p>
                      <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                        <span>{request.requestNumber}</span>
                        <span>·</span>
                        <span>{formatWhen(request.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => reviewRestock(request.id, "approved")}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                      >
                        {busyId === `${request.id}-approved` ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => reviewRestock(request.id, "rejected")}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {busyId === `${request.id}-rejected` ? "…" : "Reject"}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 p-3 text-center">
            <Link to="/inventory-requests" className="text-xs font-semibold text-emerald-700 hover:underline">
              Open Full Restock Request Desk &rarr;
            </Link>
          </div>
        </div>

        {/* Low Stock & Inventory Alerts */}
        <div className={`${EXCEL_PANEL} flex flex-col justify-between overflow-hidden`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">Low Stock & Inventory Alerts</h3>
                  <p className="text-xs text-slate-500">Products currently below safety stock threshold</p>
                </div>
              </div>
              <Link to="/vendor/inventory" className="text-xs font-semibold text-emerald-700 hover:underline">
                View Inventory &rarr;
              </Link>
            </div>

            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">Loading inventory status…</p>
              ) : lowStock.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/80" />
                  <p className="mt-2 text-sm font-semibold text-slate-800">Inventory levels are healthy</p>
                  <p className="text-xs text-slate-500">All catalog products have sufficient stock.</p>
                </div>
              ) : (
                lowStock.map((item) => (
                  <article key={item.id} className="flex items-center justify-between gap-3 p-3 sm:p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">{item.name}</p>
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                          Low Stock
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        Farmer: {item.farmerName} · {item.category}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{item.stock} Kg</p>
                      <p className="text-[10px] text-slate-400">Limit: {item.lowStockLimit} Kg</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 p-3 text-center">
            <Link to="/vendor/orders/create" className="text-xs font-semibold text-emerald-700 hover:underline">
              Create Harvest Order to Restock &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Harvest Orders Table */}
      <div className={`${EXCEL_PANEL} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <ShoppingCart className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">Recent Harvest Orders</h3>
              <p className="text-xs text-slate-500">Latest orders placed with farmers across your network</p>
            </div>
          </div>
          <Link to="/vendor/orders" className="text-xs font-semibold text-emerald-700 hover:underline">
            View All Orders &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={EXCEL_HEAD}>
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Product / Crop</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Loading orders…
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No harvest orders found yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                      <CopyId value={order.orderNumber || order.id} breakAll />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{order.farmerName}</td>
                    <td className="px-4 py-3 text-slate-700">{order.productName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {order.totalQuantity} {order.unit || "Kg"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatWhen(order.orderDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/vendor/orders/detail/${encodeURIComponent(order.id)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
