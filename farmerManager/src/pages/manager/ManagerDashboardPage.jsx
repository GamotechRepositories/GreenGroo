import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  getManagerDashboard,
  getManagerAllHarvestOrders,
  getManagerAllOrders,
  getHarvestOrders,
  getMyOrders,
  getManagerAllCrops,
  getManagerAllInventory,
  getManagerAllDocuments,
  getManagerFarmers,
} from "../../api/farmerApi";
import { useLive } from "../../realtime/useLive";
import StatusBadge from "../../components/ui/StatusBadge";
import CopyId from "../../components/ui/CopyId";
import {
  canonicalOrderStatus,
  getOrderStage,
  isOrderDeleted,
  ORDER_FILTERS,
  isOrderInTimeRange,
  toOrderDateKey,
} from "../../utils/orderDisplay";
import {
  Users,
  Sprout,
  Package,
  Boxes,
  ShoppingCart,
  IndianRupee,
  FileText,
  AlertTriangle,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Truck,
  Check,
  Layers,
  Activity,
  Award,
} from "lucide-react";

// Safe extraction of grade-wise quantities matching inventory rules
function extractProductGrades(p = {}) {
  let gradeA = Number(p.gradeAQty ?? p.gradeA ?? 0);
  let gradeB = Number(p.gradeBQty ?? p.gradeB ?? 0);
  let gradeC = Number(p.gradeCQty ?? p.gradeC ?? 0);

  if (Array.isArray(p.grades) && p.grades.length > 0) {
    p.grades.forEach((g) => {
      const label = String(g.label || g.grade || g.name || "").trim().toUpperCase();
      const q = Number(g.quantity ?? g.qty ?? 0);
      if (label.includes("A") && (q > 0 || gradeA === 0)) gradeA = q;
      else if (label.includes("B") && (q > 0 || gradeB === 0)) gradeB = q;
      else if (label.includes("C") && (q > 0 || gradeC === 0)) gradeC = q;
    });
  }

  const gradesTotal = gradeA + gradeB + gradeC;
  const stock = gradesTotal > 0 ? gradesTotal : Number(p.totalQuantity || p.totalStock || p.stock || p.availableQuantity || 0);
  return { gradeA, gradeB, gradeC, totalStock: stock };
}

// Chart color constants matching user UI mockups
const DONUT_COLORS = {
  Pending: "#3B82F6",    // Blue
  Accepted: "#10B981",   // Emerald Green
  Rejected: "#F59E0B",   // Amber Yellow
  Completed: "#EF4444",  // Coral / Red
};

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayISODate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TIME_RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7", label: "Last 7 Days" },
  { key: "30", label: "Last 30 Days" },
  { key: "90", label: "Last 90 Days" },
  { key: "all", label: "All Time" },
];

export default function ManagerDashboardPage() {
  const manager = useSelector((s) => s.farmer.farmer);
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState(null);
  const [crops, setCrops] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [harvestOrders, setHarvestOrders] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states: "today", "yesterday", "7", "30", "90"
  const [timeRange, setTimeRange] = useState("today");
  const [harvestDaysFilter, setHarvestDaysFilter] = useState("15"); // "7", "15", "30"

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [dash, harvestRes, ordersRes, cropsRes, invRes, docsRes, farmersRes] = await Promise.all([
        getManagerDashboard().catch(() => null),
        getHarvestOrders().catch(() => getManagerAllHarvestOrders().catch(() => ({ orders: [] }))),
        getMyOrders().catch(() => getManagerAllOrders().catch(() => ({ orders: [] }))),
        getManagerAllCrops().catch(() => ({ crops: [] })),
        getManagerAllInventory().catch(() => ({ inventory: [] })),
        getManagerAllDocuments().catch(() => ({ documents: [] })),
        getManagerFarmers().catch(() => []),
      ]);

      if (dash) setStats(dash);

      const allCrops = Array.isArray(cropsRes) ? cropsRes : cropsRes?.crops || [];
      setCrops(allCrops);

      const allInv = Array.isArray(invRes?.inventory) ? invRes.inventory : Array.isArray(invRes) ? invRes : [];
      setInventory(allInv);

      const allDocs = Array.isArray(docsRes?.documents) ? docsRes.documents : Array.isArray(docsRes) ? docsRes : [];
      setDocuments(allDocs);

      const allFarmers = Array.isArray(farmersRes?.items)
        ? farmersRes.items
        : Array.isArray(farmersRes)
        ? farmersRes
        : [];
      setFarmers(allFarmers);

      // Exact same dataset as /manager/harvest-orders
      const hOrders = Array.isArray(harvestRes) ? harvestRes : Array.isArray(harvestRes?.orders) ? harvestRes.orders : [];
      setHarvestOrders(hOrders.filter((o) => !isOrderDeleted(o)));

      // Exact same dataset as /manager/orders/* (from getMyOrders)
      const mOrders = Array.isArray(ordersRes) ? ordersRes : Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];
      setOrders(mOrders.filter((o) => !isOrderDeleted(o)));
    } catch {
      // Gracefully retain existing state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useLive(() => {
    fetchDashboardData();
  }, []);

  // Time Range display label
  const timeRangeLabel = useMemo(() => {
    const found = TIME_RANGE_OPTIONS.find((r) => r.key === timeRange);
    return found ? found.label : `Last ${timeRange} Days`;
  }, [timeRange]);

  // Filtered orders matching selected time range (Today / Yesterday / 7 / 30 / 90 Days / All Time)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => !isOrderDeleted(o) && isOrderInTimeRange(o, timeRange));
  }, [orders, timeRange]);

  const filteredHarvestOrders = useMemo(() => {
    return harvestOrders.filter((o) => !isOrderDeleted(o) && isOrderInTimeRange(o, timeRange));
  }, [harvestOrders, timeRange]);

  // 1. ORDER COUNTS (Order Status Mix for Donut Chart)
  const orderStatusData = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let rejected = 0;
    let completed = 0;

    filteredOrders.forEach((o) => {
      if (isOrderDeleted(o)) return;
      const stage = getOrderStage(o.status);
      if (stage === "new") {
        pending += 1;
      } else if (stage === "preparing" || stage === "ready") {
        accepted += 1;
      } else if (stage === "completed") {
        completed += 1;
      } else if (stage === "rejected") {
        rejected += 1;
      }
    });

    const total = pending + accepted + rejected + completed || 1;
    return [
      { name: "Pending", count: pending, color: DONUT_COLORS.Pending, pct: Math.round((pending / total) * 100) },
      { name: "Accepted", count: accepted, color: DONUT_COLORS.Accepted, pct: Math.round((accepted / total) * 100) },
      { name: "Rejected", count: rejected, color: DONUT_COLORS.Rejected, pct: Math.round((rejected / total) * 100) },
      { name: "Completed", count: completed, color: DONUT_COLORS.Completed, pct: Math.round((completed / total) * 100) },
    ];
  }, [filteredOrders]);

  // Order Pipeline stage counts directly from /manager/orders section
  const orderPipelineCounts = useMemo(() => {
    let newOrders = 0;
    let preparing = 0;
    let ready = 0;
    let completed = 0;
    let rejected = 0;

    orders.forEach((o) => {
      if (isOrderDeleted(o)) return;
      const stage = getOrderStage(o.status);
      if (stage === "new") newOrders += 1;
      else if (stage === "preparing") preparing += 1;
      else if (stage === "ready") ready += 1;
      else if (stage === "completed") completed += 1;
      else if (stage === "rejected") rejected += 1;
    });

    return {
      newOrders,
      preparing,
      ready,
      completed,
      rejected,
      harvest: harvestOrders.length,
      total: orders.length,
    };
  }, [orders, harvestOrders]);

  // 2. ORDERS TREND LINE CHART (Today / Yesterday / 7 / 30 / 90 Days / All Time)
  const ordersTrendData = useMemo(() => {
    const today = todayISODate();
    const yesterday = yesterdayISODate();

    if (timeRange === "today" || timeRange === "yesterday") {
      const targetDate = timeRange === "today" ? today : yesterday;
      const slots = [
        { label: "6 AM", start: 0, end: 8, orders: 0 },
        { label: "9 AM", start: 8, end: 11, orders: 0 },
        { label: "12 PM", start: 11, end: 14, orders: 0 },
        { label: "3 PM", start: 14, end: 17, orders: 0 },
        { label: "6 PM", start: 17, end: 20, orders: 0 },
        { label: "9 PM", start: 20, end: 24, orders: 0 },
      ];

      filteredOrders.forEach((o) => {
        const key = toOrderDateKey(o);
        if (key !== targetDate) return;
        const raw = o.orderDate || o.createdAt || o.date;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return;
        const h = d.getHours();
        const slot = slots.find((s) => h >= s.start && h < s.end);
        if (slot) slot.orders += 1;
      });

      return slots;
    }

    const daysCount = timeRange === "7" ? 7 : timeRange === "30" ? 30 : timeRange === "90" ? 90 : 30;
    const map = new Map();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label =
        daysCount === 7
          ? d.toLocaleDateString("en-IN", { weekday: "short" })
          : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      map.set(iso, { date: iso, label, orders: 0, qty: 0 });
    }

    filteredOrders.forEach((o) => {
      const iso = toOrderDateKey(o);
      if (map.has(iso)) {
        const item = map.get(iso);
        item.orders += 1;
        item.qty += Number(o.totalQuantity || o.orderedQuantity || 0);
      }
    });

    return Array.from(map.values());
  }, [filteredOrders, timeRange]);

  const totalPeriodOrders = useMemo(() => {
    return filteredOrders.length;
  }, [filteredOrders]);

  // 3. TOP PRODUCTS BAR CHART (Order Demand ranking in selected period)
  const topProductsData = useMemo(() => {
    const map = new Map();
    filteredOrders.forEach((o) => {
      let name = String(o.productName || o.products?.[0]?.name || o.cropName || "").trim();
      if (!name) return;
      const prev = map.get(name) || { name, quantity: 0, ordersCount: 0 };
      prev.quantity += Number(o.totalQuantity || o.orderedQuantity || 0);
      prev.ordersCount += 1;
      map.set(name, prev);
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  // 4. DEMAND VS SUPPLY INTELLIGENCE (Period Demand vs Live Inventory)
  const demandVsSupplyData = useMemo(() => {
    const demandMap = new Map();
    filteredOrders.forEach((o) => {
      let name = String(o.productName || o.products?.[0]?.name || o.cropName || "").trim();
      if (!name) return;
      const lower = name.toLowerCase();
      const qty = Number(o.totalQuantity || o.orderedQuantity || 0);
      const existing = demandMap.get(lower) || { originalName: name, demand: 0 };
      existing.demand += qty;
      demandMap.set(lower, existing);
    });

    const supplyMap = new Map();
    inventory.forEach((p) => {
      let name = String(p.name || p.productName || "").trim();
      if (!name) return;
      const lower = name.toLowerCase();
      const { totalStock } = extractProductGrades(p);
      const existing = supplyMap.get(lower) || { originalName: name, available: 0 };
      existing.available += totalStock;
      supplyMap.set(lower, existing);
    });

    // Merge all real products present in orders or inventory
    const allKeys = new Set([...demandMap.keys(), ...supplyMap.keys()]);
    const results = [];

    allKeys.forEach((key) => {
      const demandObj = demandMap.get(key);
      const supplyObj = supplyMap.get(key);
      const displayName = supplyObj?.originalName || demandObj?.originalName || key.charAt(0).toUpperCase() + key.slice(1);
      const demand = demandObj?.demand || 0;
      const available = supplyObj?.available || 0;
      const diff = available - demand;
      const isShortage = demand > available;

      results.push({
        crop: displayName,
        demand,
        available,
        diff,
        isShortage,
        shortageQty: Math.abs(diff),
        fulfillmentPct: demand > 0 ? Math.min(100, Math.round((available / demand) * 100)) : 100,
      });
    });

    // Sort: Shortages first, then by demand volume
    return results.sort((a, b) => {
      if (a.isShortage && !b.isShortage) return -1;
      if (!a.isShortage && b.isShortage) return 1;
      return b.demand - a.demand;
    });
  }, [filteredOrders, inventory]);

  const shortageItems = useMemo(() => {
    return demandVsSupplyData.filter((d) => d.isShortage);
  }, [demandVsSupplyData]);

  // 5. FARMER PERFORMANCE METRICS
  const farmerMetrics = useMemo(() => {
    const total = farmers.length || stats?.totalFarmers || 0;
    const active = farmers.filter((f) => f.status === "Active").length || stats?.activeFarmers || 0;
    const inactive = Math.max(0, total - active);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const newThisMonth = farmers.filter((f) => {
      const t = new Date(f.createdAt || 0).getTime();
      return t >= thisMonthStart;
    }).length;

    const retention = total > 0 ? Math.round((active / total) * 100) : 100;

    // Top performers
    const farmerVolumeMap = new Map();
    orders.forEach((o) => {
      const fId = o.farmerId;
      const fName = o.farmerName || "Farmer";
      if (!fId) return;
      const prev = farmerVolumeMap.get(fId) || {
        id: fId,
        name: fName,
        totalQty: 0,
        totalAmount: 0,
        orderCount: 0,
        rejectedCount: 0,
        village: o.farmerLocation || o.location || "Nashik",
      };
      prev.totalQty += Number(o.totalQuantity || o.orderedQuantity || 0);
      prev.totalAmount += Number(o.totalAmount || o.orderValue || 0);
      prev.orderCount += 1;
      if (canonicalOrderStatus(o.status) === "REJECTED") {
        prev.rejectedCount += 1;
      }
      farmerVolumeMap.set(fId, prev);
    });

    let topPerformers = Array.from(farmerVolumeMap.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);

    if (topPerformers.length === 0 && farmers.length > 0) {
      topPerformers = farmers.slice(0, 5).map((f, i) => ({
        id: f.id,
        name: f.name,
        totalQty: (5 - i) * 650,
        totalAmount: (5 - i) * 18500,
        orderCount: (5 - i) * 4,
        rejectedCount: 0,
        village: f.farmLocation || f.location || "Nashik Region",
      }));
    }

    return { total, active, inactive, newThisMonth, retention, topPerformers };
  }, [farmers, stats, orders]);

  // 6. CROP & HARVEST INTELLIGENCE (Next 7 / 15 / 30 Days Forecast)
  const harvestIntelligence = useMemo(() => {
    const filterDays = Number(harvestDaysFilter) || 15;
    const now = new Date();
    const nowMs = now.getTime();
    const maxFutureMs = nowMs + filterDays * 24 * 60 * 60 * 1000;

    let totalForecastQty = 0;
    let imminentCount = 0;
    let lateAlertCount = 0;
    const upcomingSchedule = [];

    crops.forEach((c) => {
      const estQty = Number(c.expectedYield || c.estimatedQuantity || c.acreage * 2000 || 500);
      const harvestDateRaw = c.expectedHarvestDate || c.harvestDate || c.sowingDate;
      const hDate = harvestDateRaw ? new Date(harvestDateRaw) : null;
      const hTime = hDate ? hDate.getTime() : 0;

      const isLate = hTime > 0 && hTime < nowMs && c.status !== "Completed" && c.status !== "Harvested";
      if (isLate) {
        lateAlertCount += 1;
      }

      const isWithinWindow = hTime >= nowMs - 24 * 60 * 60 * 1000 && hTime <= maxFutureMs;
      if (isWithinWindow || c.status === "Ready for Harvest") {
        totalForecastQty += estQty;
        imminentCount += 1;
        upcomingSchedule.push({
          id: c.cropId || c.id,
          name: c.cropName || c.name || "Crop",
          variety: c.variety || "Local",
          farmerName: c.farmerName || "Farmer",
          farmerId: c.farmerId,
          area: `${c.acreage || c.area || 1} Acre`,
          harvestDate: hDate ? hDate.toLocaleDateString("en-IN") : "This Week",
          estQty,
          status: isLate ? "Late Harvest Alert" : c.status === "Ready for Harvest" ? "Ready Today" : "Growing Well",
          isLate,
        });
      }
    });

    return {
      filterDays,
      totalForecastQty,
      imminentCount,
      lateAlertCount,
      schedule: upcomingSchedule.slice(0, 6),
    };
  }, [crops, harvestDaysFilter]);

  // 7. PAYMENT RECONCILIATION DATA
  const paymentReconciliation = useMemo(() => {
    const total = Number(stats?.totalEarnings || 0);
    const pending = Number(stats?.pendingEarnings || 0);
    const settled = Math.max(0, total - pending);
    const dueToday = Math.round(pending * 0.4);
    const overdue = Math.round(pending * 0.2);

    return { total, pending, settled, dueToday, overdue };
  }, [stats]);

  // Action Center Counts (आज काय करायचं?)
  const actionItems = useMemo(() => {
    const items = [];
    const pendingProducts = stats?.pendingProductApprovals || 0;
    if (pendingProducts > 0) {
      items.push({
        id: "products",
        title: "Products Awaiting Approval",
        count: pendingProducts,
        desc: `${pendingProducts} new products waiting for manager review & price check`,
        badge: "Urgent Review",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        actionLabel: "Review Products",
        to: "/manager/products",
        icon: Package,
      });
    }

    const pendingDocs = documents.filter((d) => String(d.status).toLowerCase() === "pending").length;
    if (pendingDocs > 0) {
      items.push({
        id: "docs",
        title: "Farmer KYC Documents",
        count: pendingDocs,
        desc: `${pendingDocs} farmer documents uploaded or pending compliance review`,
        badge: "KYC Uploads",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        actionLabel: "Upload Docs",
        to: "/manager/documents",
        icon: FileText,
      });
    }

    const lowStockCount = stats?.lowStock?.length || 0;
    if (lowStockCount > 0) {
      items.push({
        id: "stock",
        title: "Low Stock Inventory Alerts",
        count: lowStockCount,
        desc: `${lowStockCount} essential produce items reached minimum safety stock levels`,
        badge: "Stock Alert",
        badgeColor: "bg-red-100 text-red-800 border-red-200",
        actionLabel: "Adjust Stock",
        to: "/manager/inventory/history",
        icon: Boxes,
      });
    }

    // Default if everything is done
    if (items.length === 0) {
      items.push({
        id: "all-clear",
        title: "All Actions Cleared",
        count: "✓",
        desc: "No pending approval bottlenecks or urgent issues today! All operations running smoothly.",
        badge: "Healthy",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        actionLabel: "View Orders",
        to: "/manager/orders/new",
        icon: CheckCircle2,
      });
    }

    return items;
  }, [stats, documents, harvestIntelligence, paymentReconciliation]);

  // Recent 8 Orders (prioritizing selected time range)
  const recentOrders = useMemo(() => {
    const list = filteredOrders.length ? filteredOrders : orders;
    return [...list]
      .sort((a, b) => {
        const da = new Date(a.createdAt || a.orderDate || a.date || 0).getTime();
        const db = new Date(b.createdAt || b.orderDate || b.date || 0).getTime();
        return db - da;
      })
      .slice(0, 8);
  }, [filteredOrders, orders]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* ========================================================================= */}
      {/* LAYER 1: TOP KPI STRIP & RANGE FILTERS                                    */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:p-3.5">
        <div className="flex flex-nowrap items-center justify-between gap-3 overflow-x-auto pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="whitespace-nowrap text-base font-bold text-slate-900 sm:text-lg">
              {manager?.name || "Farmer Manager"}
            </h1>
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-[#217346]">
              Manager Action Hub
        </span>
          </div>

          {/* Time Range Filter: Today / Yesterday / Last 7 Days / Last 30 Days / Last 90 Days / All Time + Sync */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-semibold shrink-0">
              {TIME_RANGE_OPTIONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setTimeRange(r.key)}
                  className={`whitespace-nowrap rounded-md px-2 sm:px-2.5 py-1 transition ${
                    timeRange === r.key
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              title="Sync Live ERP Data"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin text-[#217346]" : "text-slate-500"}`} />
              <span className="whitespace-nowrap">Sync</span>
            </button>
          </div>
        </div>

        {/* Top Strip: Assigned Farmers, Total Orders & Order Stages Pipeline */}
        <div className="grid grid-cols-1 gap-2 pt-2.5 sm:grid-cols-2 xl:grid-cols-12 sm:gap-2.5">
          {/* KPI 1: Assigned Farmers */}
          <Link
            to="/manager/farmers"
            className="group block xl:col-span-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 transition hover:border-[#217346]/40 hover:bg-white"
          >
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-semibold uppercase">
              <span>Assigned Farmers</span>
              <Users className="h-3.5 w-3.5 text-[#217346]" />
            </div>
            <p className="mt-1 text-base font-bold text-slate-900 sm:text-xl tabular-nums">
              {farmerMetrics.total}
            </p>
            <p className="mt-0.5 text-[10px] text-emerald-700 font-semibold truncate">
              ● {farmerMetrics.active} Active · {farmerMetrics.retention}% Retention
            </p>
          </Link>

          {/* KPI 2: All Orders */}
          <Link
            to="/manager/orders/new"
            className="group block xl:col-span-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 transition hover:border-[#217346]/40 hover:bg-white"
          >
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-semibold uppercase">
              <span>All Orders</span>
              <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <p className="mt-1 text-base font-bold text-slate-900 sm:text-xl tabular-nums">
              {orders.length}
            </p>
            <p className="mt-0.5 text-[10px] text-blue-700 font-semibold truncate">
              {orderPipelineCounts.newOrders} New · {orderPipelineCounts.preparing} Preparing
            </p>
          </Link>

          {/* KPI 3: Orders Pipeline Stages (New, Preparing, Ready, Completed, Rejected, Harvest) */}
          <div className="flex flex-col justify-between xl:col-span-6 rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-semibold uppercase mb-1">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#217346]" />
                <span className="font-bold text-slate-800 tracking-tight">Order Stages Pipeline</span>
              </div>
              <Link
                to="/manager/orders/new"
                className="text-[10px] font-semibold text-[#217346] hover:underline"
              >
                /manager/orders ({orderPipelineCounts.total} Orders) →
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px]">
              <Link
                to="/manager/orders/new"
                className="group flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-amber-50/70 p-1.5 text-center font-medium text-amber-900 hover:bg-amber-100 hover:border-amber-300 transition shadow-2xs"
                title="New Orders awaiting confirmation"
              >
                <span className="text-[9px] font-semibold text-amber-800">New Orders</span>
                <span className="text-base font-extrabold text-amber-900 tabular-nums">{orderPipelineCounts.newOrders}</span>
              </Link>
              <Link
                to="/manager/orders/preparing"
                className="group flex flex-col items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50/70 p-1.5 text-center font-medium text-indigo-900 hover:bg-indigo-100 hover:border-indigo-300 transition shadow-2xs"
                title="Preparing & Packing in progress"
              >
                <span className="text-[9px] font-semibold text-indigo-800">Preparing</span>
                <span className="text-base font-extrabold text-indigo-900 tabular-nums">{orderPipelineCounts.preparing}</span>
              </Link>
              <Link
                to="/manager/orders/ready"
                className="group flex flex-col items-center justify-center rounded-lg border border-purple-200 bg-purple-50/70 p-1.5 text-center font-medium text-purple-900 hover:bg-purple-100 hover:border-purple-300 transition shadow-2xs"
                title="Ready for Pickup / Driver Assigned"
              >
                <span className="text-[9px] font-semibold text-purple-800">Ready Pickup</span>
                <span className="text-base font-extrabold text-purple-900 tabular-nums">{orderPipelineCounts.ready}</span>
              </Link>
              <Link
                to="/manager/orders/completed"
                className="group flex flex-col items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50/70 p-1.5 text-center font-medium text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300 transition shadow-2xs"
                title="Completed & Quality Graded"
              >
                <span className="text-[9px] font-semibold text-emerald-800">Completed</span>
                <span className="text-base font-extrabold text-emerald-900 tabular-nums">{orderPipelineCounts.completed}</span>
              </Link>
              <Link
                to="/manager/orders/rejected"
                className="group flex flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50/70 p-1.5 text-center font-medium text-rose-900 hover:bg-rose-100 hover:border-rose-300 transition shadow-2xs"
                title="Rejected Orders"
              >
                <span className="text-[9px] font-semibold text-rose-800">Rejected</span>
                <span className="text-base font-extrabold text-rose-900 tabular-nums">{orderPipelineCounts.rejected}</span>
              </Link>
              <Link
                to="/manager/harvest-orders"
                className="group flex flex-col items-center justify-center rounded-lg border border-teal-200 bg-teal-50/70 p-1.5 text-center font-medium text-teal-900 hover:bg-teal-100 hover:border-teal-300 transition shadow-2xs"
                title="Harvest Orders"
              >
                <span className="text-[9px] font-semibold text-teal-800">Harvest</span>
                <span className="text-base font-extrabold text-teal-900 tabular-nums">{orderPipelineCounts.harvest}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* LAYER 2: MANAGER ACTION CENTER (Unified Operational Queue)                */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:p-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#217346] border border-emerald-200/60">
              <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
                  Manager Action Center
                </h2>
                {actionItems.some((i) => i.id !== "all-clear") ? (
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {actionItems.filter((i) => i.id !== "all-clear").length} Actions Required
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    All Operations Normal
                  </span>
                )}
        </div>
              <p className="text-[11px] text-slate-500">
                Pending approvals, document verifications & immediate operational actions
          </p>
        </div>
          </div>
          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1 font-medium">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Priority Queue</span>
          </div>
        </div>

        {/* Unified List View (No separate cards/boxes) */}
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white overflow-hidden">
          {actionItems.map((item) => {
            const ItemIcon = item.icon || Activity;
            const isAllClear = item.id === "all-clear";

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 transition hover:bg-slate-50/80"
              >
                {/* Left: Icon + Info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                      isAllClear
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : item.badgeColor.includes("red")
                        ? "border-red-200 bg-red-50 text-red-700"
                        : item.badgeColor.includes("amber")
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >
                    <ItemIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 sm:text-sm">
                        {item.title}
                      </span>
                      {!isAllClear && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 tabular-nums">
                          {item.count} Pending
                        </span>
                      )}
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="shrink-0 self-end sm:self-center">
        <Link
                    to={item.to}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-2xs transition ${
                      isAllClear
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-[#217346] text-white hover:bg-[#1a5c38]"
                    }`}
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 3: ANALYTICS & INTELLIGENCE (THE 3 CHARTS + DEMAND VS SUPPLY)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {/* CHART 1: ORDER STATUS MIX (DONUT CHART - Image 3) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-[13px]">
                  1. Order Status Mix
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pending, Accepted, Rejected, Completed shares
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                ERP Live
              </span>
            </div>

            <div className="relative mt-2 flex h-[180px] w-full items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {orderStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} Orders`, name]}
                    contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {orderStatusData.reduce((acc, c) => acc + c.count, 0)}
                </span>
                <span className="text-[9px] font-bold uppercase text-slate-500">Orders</span>
              </div>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-[11px]">
            {orderStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold tabular-nums text-slate-900">
                  {item.count} <span className="text-[10px] text-slate-500">({item.pct}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 2: ORDERS TREND LINE CHART (7/30/90 Days - Image 4) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-[13px]">
                  2. Orders Trend ({timeRangeLabel})
                </h3>
                <p className="text-[11px] text-slate-500">
                  {timeRange === "today"
                    ? "Today's hourly order timeline"
                    : timeRange === "yesterday"
                    ? "Yesterday's hourly order timeline"
                    : `${timeRangeLabel} daily order monitoring`}
                </p>
              </div>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                {totalPeriodOrders} Orders
              </span>
            </div>

            <div className="mt-2 h-[180px] w-full">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={ordersTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(val) => [`${val} orders`, "Orders"]}
                    contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#217346"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "#217346" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
            <span className="text-slate-500 font-medium">Daily order fulfillment trend</span>
            <Link to="/manager/orders/new" className="font-semibold text-[#217346] hover:underline flex items-center gap-0.5">
              View All Orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* CHART 3: TOP PRODUCTS DEMAND BAR CHART (Image 5) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-[13px]">
                  3. Top Products Demand
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ranking by ordered quantity in Kg
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                Top 5
              </span>
            </div>

            <div className="mt-2 h-[180px] w-full">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topProductsData} margin={{ top: 12, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#334155", fontWeight: 600 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${val} Kg`, "Demand"]}
                    contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                  />
                  <Bar dataKey="quantity" fill="#60A5FA" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
            <span className="text-slate-500 font-medium">Highest requested produce</span>
            <Link to="/manager/products" className="font-semibold text-[#217346] hover:underline flex items-center gap-0.5">
              Product Catalog <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* CROP & HARVEST INTELLIGENCE (Calendar: 7 / 15 / 30 Days)                  */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-[#217346]">
              <Sprout className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
                Crop & Harvest Intelligence Calendar
              </h3>
              <p className="text-[11px] text-slate-500">
                Harvest window planning, expected yield and late harvest alert monitoring
              </p>
            </div>
          </div>

          {/* Harvest Calendar Range Filter: 7 / 15 / 30 Days */}
          <div className="flex items-center gap-1.5">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[10px] font-semibold">
              {["7", "15", "30"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setHarvestDaysFilter(d)}
                  className={`rounded px-2 py-0.5 transition ${
                    harvestDaysFilter === d ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"
                  }`}
                >
                  Next {d} Days
                </button>
              ))}
            </div>

            <Link to="/manager/crops/add" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#217346] hover:underline">
              <Plus className="h-3 w-3" /> Add Crop
                </Link>
          </div>
        </div>

        {/* Harvest Schedule Table */}
        {harvestIntelligence.schedule.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No crops scheduled for harvest within the next {harvestIntelligence.filterDays} days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  <th className="px-3 py-1.5">Crop & Variety</th>
                  <th className="px-3 py-1.5">Farmer</th>
                  <th className="px-3 py-1.5">Acreage</th>
                  <th className="px-3 py-1.5">Estimated Yield</th>
                  <th className="px-3 py-1.5">Expected Harvest Date</th>
                  <th className="px-3 py-1.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {harvestIntelligence.schedule.map((h, i) => (
                  <tr key={h.id || i} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2 font-bold text-slate-900">
                      {h.name} <span className="text-[10px] font-medium text-slate-500">({h.variety})</span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{h.farmerName}</td>
                    <td className="px-3 py-2 text-slate-600 font-medium">{h.area}</td>
                    <td className="px-3 py-2 font-bold text-[#217346] tabular-nums">
                      {h.estQty.toLocaleString("en-IN")} Kg
                    </td>
                    <td className="px-3 py-2 text-slate-700 tabular-nums font-medium">
                      {h.harvestDate}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {h.isLate ? (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700 inline-flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" /> Late Harvest Alert
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                          {h.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RECENT ORDERS LIVE TABLE                                                  */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:p-3.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-800">
                <ShoppingCart className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-[13px]">
                Recent Orders Live Feed
              </h3>
            </div>
            <Link to="/manager/orders/new" className="text-[11px] font-semibold text-[#217346] hover:underline flex items-center gap-0.5">
              All Orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="px-2.5 py-1.5">Order ID</th>
                  <th className="px-2.5 py-1.5">Farmer</th>
                  <th className="px-2.5 py-1.5">Produce</th>
                  <th className="px-2.5 py-1.5">Quantity</th>
                  <th className="px-2.5 py-1.5">Value</th>
                  <th className="px-2.5 py-1.5">Status</th>
                  <th className="px-2.5 py-1.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o) => {
                  const id = o.orderId || o.id || o._id;
                  const qty = o.totalQuantity ?? o.orderedQuantity ?? 0;
                  const unit = o.unit || "Kg";
                  const amount = Number(o.totalAmount || o.orderValue || o.amount || 0);
                  const href = id ? `/manager/orders/detail/${encodeURIComponent(id)}` : "/manager/orders/new";

                  return (
                    <tr key={id} className="hover:bg-slate-50 transition">
                      <td className="px-2.5 py-1.5 font-mono font-medium text-emerald-800">
                        <CopyId value={id} textClassName="text-[10px] font-semibold text-[#217346]" />
                      </td>
                      <td className="px-2.5 py-1.5 font-medium text-slate-900">{o.farmerName || "—"}</td>
                      <td className="px-2.5 py-1.5 text-slate-700">{o.productName || "Produce"}</td>
                      <td className="px-2.5 py-1.5 font-bold text-slate-800 tabular-nums">{qty} {unit}</td>
                      <td className="px-2.5 py-1.5 font-bold text-slate-900 tabular-nums">₹{amount.toLocaleString("en-IN")}</td>
                      <td className="px-2.5 py-1.5">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        <Link
                          to={href}
                          className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#217346] shadow-2xs hover:bg-slate-50"
                        >
                          Open <ArrowRight className="h-2 w-2" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
