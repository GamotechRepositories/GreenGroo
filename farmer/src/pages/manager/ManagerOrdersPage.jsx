import { Fragment, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteManagerFarmerOrder, getManagerAllHarvestOrders, getManagerAllProducts } from "../../api/farmerApi";
import { usePolling } from "../../hooks/usePolling";
import {
  formatOrderDate,
  managerOrderBucket,
  matchesManagerOrderFilter,
  matchesOrderDateRange,
  todayISODate,
  yesterdayISODate,
} from "../../utils/orderDisplay";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { isPendingProductApproval } from "../../utils/productActions";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

const ACTION_BASE =
  "inline-flex h-6 min-w-[2.75rem] flex-1 items-center justify-center rounded px-1 text-[9px] font-semibold leading-none whitespace-nowrap";
const ACTION_BTN = `${ACTION_BASE} border border-[#D4D4D4] bg-white text-[#1F2937] hover:bg-[#F3F4F6]`;
const ACTION_BTN_DANGER = `${ACTION_BASE} border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50`;

const TAB_STATEMENTS = "statements";
const TAB_BY_PRODUCT = "by-product";
const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

const TH =
  "border border-[#C5D4C8] bg-[#E8F0EA] px-1 py-1.5 text-center text-[9px] font-bold leading-tight text-[#374151] sm:px-1.5 sm:text-[10px]";
const TD = "border border-[#E5E7EB] px-1 py-1.5 text-[10px] leading-tight text-[#1F2937] sm:px-1.5 sm:text-[11px]";

const GRADE_COLORS = {
  "Grade A": {
    head: "border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]",
    cell: "border-[#A7F3D0] bg-[#ECFDF5]",
  },
  "Grade B": {
    head: "border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]",
    cell: "border-[#BFDBFE] bg-[#EFF6FF]",
  },
  "Grade C": {
    head: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
    cell: "border-[#FDE68A] bg-[#FFFBEB]",
  },
};

function gradeTone(label = "") {
  return (
    GRADE_COLORS[label] || {
      head: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]",
      cell: "border-[#E5E7EB] bg-[#F9FAFB]",
    }
  );
}

function shortDate(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const full = formatOrderDate(value);
    return full && full !== "—" ? full : "—";
  }
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatTime12h(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/am|pm/i.test(raw)) return raw.replace(/\s+/g, " ");
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw;
  let hour = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${min} ${period}`;
}

function gradeDetailMap(order) {
  const map = {};
  const unit = order.unit || orderProductEntry(order).unit || "Kg";
  (Array.isArray(order.grades) ? order.grades : []).forEach((g) => {
    const label = String(g.label || g.name || "").trim();
    if (!label) return;
    const qty = Number(g.quantity || 0);
    const rate = Number(g.price ?? g.rate ?? g.pricePerKg ?? 0) || 0;
    if (!map[label]) map[label] = { qty: 0, rate: 0, unit };
    map[label].qty += qty;
    if (rate > 0) map[label].rate = rate;
  });
  if (!Object.keys(map).length) {
    const entry = orderProductEntry(order);
    const label = String(order.grade || "Grade A").trim() || "Grade A";
    const qty = Number(entry.quantity || order.orderedQuantity || 0);
    const rate = Number(order.price || 0) || 0;
    map[label] = { qty, rate, unit: entry.unit || unit };
  }
  return map;
}

function formatQty(qty, unit) {
  const n = Number(qty || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return (
    <span>
      {n.toLocaleString("en-IN")}
      <span className="ml-0.5 text-[8px] text-[#6B7280] sm:text-[9px]">{unit || "Kg"}</span>
    </span>
  );
}

function formatRate(rate, qty = 0) {
  if (!(Number(qty || 0) > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  const n = Number(rate || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return `₹${n.toLocaleString("en-IN")}`;
}

function isBusinessProductId(value) {
  const id = String(value || "").trim();
  return Boolean(id) && !/^[a-f0-9]{24}$/i.test(id);
}

function productKeyOf(item = {}) {
  const id = String(item.productId || item.id || "").trim();
  if (isBusinessProductId(id)) return id;
  return String(item.productName || item.name || "Produce").trim().toLowerCase();
}

function productNameOf(item = {}) {
  return item.productName || item.name || "Farm Produce";
}

function isAvailableForOrder(product) {
  const status = String(product?.status || "").trim();
  if (!status) return true;
  if (isPendingProductApproval(status)) return false;
  if (status === "Draft" || status === "Rejected" || status === "Paused") return false;
  return true;
}

function productQty(product) {
  const gradesSum = (product.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  return gradesSum || Number(product.availableQuantity ?? product.stock ?? 0);
}

function productFarmersPath(product) {
  const key = productKeyOf(product);
  const params = new URLSearchParams({ name: productNameOf(product) });
  const productId = product.productId || product.id || "";
  if (productId) params.set("productId", productId);
  return `/farmer/manager/orders/product/${encodeURIComponent(key)}/farmers?${params.toString()}`;
}

function orderProductEntry(order) {
  const first = Array.isArray(order.products) && order.products.length > 0 ? order.products[0] : {};
  const productId = [order.productId, first.productId, first.id].find((v) => isBusinessProductId(v)) || "";
  const qtyFromGrades = (order.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  const qtyFromProducts = (order.products || []).reduce((s, p) => s + Number(p.quantity || 0), 0);
  return {
    productId,
    productName: order.productName || first.name || "Farm Produce",
    variety: order.variety || first.variety || "",
    quantity: Number(order.totalQuantity || order.orderedQuantity || 0) || qtyFromGrades || qtyFromProducts,
    amount: Number(order.totalAmount || order.orderValue || order.amount || 0),
    unit: order.unit || first.unit || "Kg",
    category: order.category || first.category || "",
  };
}

function orderViewPath(order) {
  const id = order.id || order.orderId;
  const params = new URLSearchParams();
  if (order.farmerId) params.set("farmerId", order.farmerId);
  const qs = params.toString();
  return `/farmer/manager/orders/detail/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`;
}

function OrdersNavRow({ tab, statusFilter, onTab, onStatus, counts }) {
  const base =
    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1.5 text-center transition-colors sm:min-h-9 sm:flex-row sm:gap-1 sm:px-2";
  const labelCls = "text-[10px] font-semibold leading-tight sm:text-[11px]";
  const countCls = "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums";
  const activeAll = tab === TAB_STATEMENTS && statusFilter === "all";
  const activePending = tab === TAB_STATEMENTS && statusFilter === "pending";
  const activeAccepted = tab === TAB_STATEMENTS && statusFilter === "accepted";
  const activeRejected = tab === TAB_STATEMENTS && statusFilter === "rejected";
  const activeByProduct = tab === TAB_BY_PRODUCT;

  return (
    <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={() => {
          onTab(TAB_STATEMENTS);
          onStatus("all");
        }}
        className={`${base} ${
          activeAll
            ? "border-[#217346] bg-[#E8F5E9] text-[#217346] ring-1 ring-[#217346]"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <span className={`${labelCls} sm:hidden`}>All</span>
        <span className={`${labelCls} hidden sm:inline`}>All Orders</span>
        <span className={`${countCls} bg-[#217346] text-white`}>{counts.all || 0}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onTab(TAB_STATEMENTS);
          onStatus("pending");
        }}
        className={`${base} ${
          activePending
            ? "border-sky-500 bg-sky-50 text-sky-800 ring-1 ring-sky-500"
            : "border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
        }`}
      >
        <span className={`${labelCls} sm:hidden`}>Pending</span>
        <span className={`${labelCls} hidden sm:inline`}>Approval Pending</span>
        <span className={`${countCls} bg-sky-600 text-white`}>{counts.pending || 0}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onTab(TAB_STATEMENTS);
          onStatus("accepted");
        }}
        className={`${base} ${
          activeAccepted
            ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600"
            : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        <span className={labelCls}>Accepted</span>
        <span className={`${countCls} bg-emerald-700 text-white`}>{counts.accepted || 0}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onTab(TAB_STATEMENTS);
          onStatus("rejected");
        }}
        className={`${base} ${
          activeRejected
            ? "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500"
            : "border-red-200 bg-white text-red-600 hover:bg-red-50"
        }`}
      >
        <span className={labelCls}>Rejected</span>
        <span className={`${countCls} bg-red-600 text-white`}>{counts.rejected || 0}</span>
      </button>

      <button
        type="button"
        onClick={() => onTab(TAB_BY_PRODUCT)}
        className={`${base} ${
          activeByProduct
            ? "border-[#217346] bg-[#217346] text-white ring-1 ring-[#217346]"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <span className={labelCls}>By Product</span>
      </button>
    </div>
  );
}

/** Simple donut + bars using the same 3 status colors as the filter chips */
function OrderStatusChart({ counts, statusFilter, onStatus }) {
  const segments = [
    { key: "pending", label: "Approval Pending", value: Number(counts.pending || 0), color: "#0284C7" },
    { key: "accepted", label: "Accepted", value: Number(counts.accepted || 0), color: "#047857" },
    { key: "rejected", label: "Rejected", value: Number(counts.rejected || 0), color: "#DC2626" },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0) || 0;
  const max = Math.max(...segments.map((x) => x.value), 1);

  const radius = 36;
  const stroke = 12;
  const c = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={`${EXCEL_PANEL} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-6`}>
      <div className="flex shrink-0 items-center gap-3">
        <div className="relative h-[88px] w-[88px]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
            {total > 0
              ? segments.map((seg) => {
                  if (!(seg.value > 0)) return null;
                  const len = (seg.value / total) * c;
                  const dash = `${len} ${c - len}`;
                  const el = (
                    <circle
                      key={seg.key}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={stroke}
                      strokeDasharray={dash}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                    />
                  );
                  offset += len;
                  return el;
                })
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-[#1F2937]">{total}</span>
            <span className="text-[9px] font-semibold text-[#6B7280]">Orders</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {segments.map((seg) => (
            <button
              key={seg.key}
              type="button"
              onClick={() => onStatus(statusFilter === seg.key ? "all" : seg.key)}
              className={`flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-slate-50 ${
                statusFilter === seg.key ? "ring-1 ring-slate-200" : ""
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-[11px] font-semibold" style={{ color: seg.color }}>
                {seg.label}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-[#1F2937]">{seg.value}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          const widthPct = Math.max((seg.value / max) * 100, seg.value > 0 ? 6 : 0);
          return (
            <button
              key={`bar-${seg.key}`}
              type="button"
              onClick={() => onStatus(statusFilter === seg.key ? "all" : seg.key)}
              className="block w-full text-left"
            >
              <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                <span className="font-semibold" style={{ color: seg.color }}>
                  {seg.label}
                </span>
                <span className="tabular-nums text-[#6B7280]">
                  {seg.value} · {pct}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#F3F4F6]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${widthPct}%`, backgroundColor: seg.color }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ManagerOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === TAB_BY_PRODUCT ? TAB_BY_PRODUCT : TAB_STATEMENTS;
  const rawStatus = searchParams.get("status");
  const statusFilter = ["pending", "accepted", "rejected"].includes(rawStatus) ? rawStatus : "all";
  const dateFrom = searchParams.get("from") || "";
  const dateTo = searchParams.get("to") || "";
  const [farmers, setFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const setTab = (next) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === TAB_STATEMENTS) nextParams.delete("tab");
    else {
      nextParams.set("tab", next);
      nextParams.delete("status");
    }
    setSearchParams(nextParams, { replace: true });
    setQ("");
  };

  const setStatusFilter = (next) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("tab");
    if (next === "all") nextParams.delete("status");
    else nextParams.set("status", next);
    setSearchParams(nextParams, { replace: true });
  };

  const setDateRange = (from, to) => {
    const nextParams = new URLSearchParams(searchParams);
    if (from) nextParams.set("from", from);
    else nextParams.delete("from");
    if (to) nextParams.set("to", to);
    else nextParams.delete("to");
    setSearchParams(nextParams, { replace: true });
  };

  const setTodayFilter = () => {
    const today = todayISODate();
    setDateRange(today, today);
  };

  const setYesterdayFilter = () => {
    const yesterday = yesterdayISODate();
    setDateRange(yesterday, yesterday);
  };

  const clearDateFilter = () => setDateRange("", "");

  const handleDeleteOrder = async (order) => {
    const orderId = order.id || order.orderId;
    const farmerId = order.farmerId;
    if (!orderId || !farmerId) {
      toast.error("Cannot delete: farmer or order id missing");
      return;
    }
    if (!window.confirm(`Delete order ${orderId}?`)) return;
    setDeletingId(orderId);
    try {
      await deleteManagerFarmerOrder(farmerId, orderId);
      toast.success("Order deleted");
      setOrders((prev) =>
        prev.filter((o) => o.id !== orderId && o.orderId !== orderId && String(o._id || "") !== String(orderId))
      );
    } catch (err) {
      toast.error(err?.message || "Failed to delete order");
    } finally {
      setDeletingId("");
    }
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [harvestData, productData] = await Promise.all([
        getManagerAllHarvestOrders().catch(() => ({ farmers: [], orders: [] })),
        getManagerAllProducts().catch(() => ({ farmers: [], products: [] })),
      ]);
      setFarmers(
        Array.isArray(harvestData?.farmers)
          ? harvestData.farmers
          : Array.isArray(productData?.farmers)
            ? productData.farmers
            : []
      );
      setOrders(Array.isArray(harvestData?.orders) ? harvestData.orders : []);
      setProducts(Array.isArray(productData?.products) ? productData.products : []);
    } catch {
      setFarmers([]);
      setOrders([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  usePolling(() => {
    loadData(true);
  }, [], 5000);

  const dateFilteredOrders = useMemo(
    () => orders.filter((o) => matchesOrderDateRange(o, dateFrom, dateTo)),
    [orders, dateFrom, dateTo]
  );

  const statusCounts = useMemo(() => {
    const counts = { all: dateFilteredOrders.length, pending: 0, accepted: 0, rejected: 0 };
    dateFilteredOrders.forEach((o) => {
      const bucket = managerOrderBucket(o.status);
      counts[bucket] += 1;
    });
    return counts;
  }, [dateFilteredOrders]);

  const filteredOrders = useMemo(() => {
    const query = q.toLowerCase().trim();
    return dateFilteredOrders
      .filter((o) => matchesManagerOrderFilter(o.status, statusFilter))
      .filter((o) => {
        if (!query) return true;
        const entry = orderProductEntry(o);
        const farmerName = o.farmerName || farmers.find((f) => f.id === o.farmerId)?.name || "";
        return (
          String(o.id || o.orderId || "")
            .toLowerCase()
            .includes(query) ||
          entry.productName.toLowerCase().includes(query) ||
          String(entry.productId || "")
            .toLowerCase()
            .includes(query) ||
          farmerName.toLowerCase().includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.orderDate || b.harvestDate || b.createdAt || 0) -
          new Date(a.orderDate || a.harvestDate || a.createdAt || 0)
      );
  }, [dateFilteredOrders, statusFilter, q, farmers]);

  const gradeColumns = useMemo(() => {
    const set = new Set(DEFAULT_GRADES);
    filteredOrders.forEach((o) => {
      Object.keys(gradeDetailMap(o)).forEach((label) => set.add(label));
    });
    const extras = Array.from(set).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
    return [...DEFAULT_GRADES, ...extras];
  }, [filteredOrders]);

  const availableProducts = useMemo(() => {
    const query = q.toLowerCase().trim();
    return products.filter((p) => {
      if (!isAvailableForOrder(p)) return false;
      if (!query) return true;
      return (
        productNameOf(p).toLowerCase().includes(query) ||
        String(p.variety || "").toLowerCase().includes(query) ||
        String(p.category || "").toLowerCase().includes(query) ||
        String(p.productId || p.id || "").toLowerCase().includes(query)
      );
    });
  }, [products, q]);

  return (
    <div className="min-w-0 space-y-2 sm:space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-[#1F2937] sm:text-xl">Order Management</h1>
          {tab === TAB_BY_PRODUCT ? (
            <p className="text-[11px] text-[#6B7280] sm:text-sm">Create harvest orders from available products</p>
          ) : null}
        </div>
        <Link
          to="/farmer/manager/orders/create"
          className={`${EXCEL_BTN_PRIMARY} shrink-0 !min-h-9 px-3 py-1.5 text-[11px] sm:!min-h-10 sm:text-xs`}
        >
          + Order
        </Link>
      </div>

      <OrdersNavRow
        tab={tab}
        statusFilter={statusFilter}
        onTab={setTab}
        onStatus={setStatusFilter}
        counts={statusCounts}
      />

      {tab === TAB_STATEMENTS ? (
        <OrderStatusChart counts={statusCounts} statusFilter={statusFilter} onStatus={setStatusFilter} />
      ) : null}

      {tab === TAB_BY_PRODUCT ? (
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {[
            { label: "Available", value: availableProducts.length, color: "text-[#217346]" },
            { label: "All Products", value: products.length, color: "text-emerald-700" },
          ].map((s) => (
            <div key={s.label} className={`${EXCEL_PANEL} px-2.5 py-1.5 sm:px-3 sm:py-2`}>
              <p className="text-[10px] text-[#6B7280]">{s.label}</p>
              <p className={`text-sm font-bold sm:text-base ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        {tab === TAB_STATEMENTS ? (
          <div className="flex flex-wrap items-end gap-1.5">
            <label className="block">
              <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">From</span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateRange(e.target.value, dateTo)}
                className={`${EXCEL_INPUT} !w-auto !py-2 !text-xs sm:!py-1.5`}
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">To</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateRange(dateFrom, e.target.value)}
                className={`${EXCEL_INPUT} !w-auto !py-2 !text-xs sm:!py-1.5`}
              />
            </label>
            <button type="button" onClick={setTodayFilter} className={`${EXCEL_BTN} !min-h-9 !px-2.5 !text-[11px]`}>
              Today
            </button>
            <button type="button" onClick={setYesterdayFilter} className={`${EXCEL_BTN} !min-h-9 !px-2.5 !text-[11px]`}>
              Yesterday
            </button>
            {dateFrom || dateTo ? (
              <button type="button" onClick={clearDateFilter} className={`${EXCEL_BTN} !min-h-9 !px-2.5 !text-[11px]`}>
                Clear date
              </button>
            ) : null}
          </div>
        ) : null}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === TAB_BY_PRODUCT ? "Search product or ID…" : "Search order, product, farmer…"}
          className={`${EXCEL_INPUT} w-full !py-2 !text-xs sm:max-w-xs sm:!py-1.5`}
        />
      </div>

      {loading ? (
        <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>Loading…</div>
      ) : tab === TAB_BY_PRODUCT ? (
        availableProducts.length === 0 ? (
          <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>
            No available products. Approve or add a product first.
          </div>
        ) : (
          <div className={EXCEL_PANEL}>
            <div className="divide-y divide-[#E5E7EB] sm:hidden">
              {availableProducts.map((p) => {
                const id = p.id || p.productId;
                const name = productNameOf(p);
                const qty = productQty(p);
                return (
                  <div key={id} className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={productFarmersPath(p)} className="block truncate text-[13px] font-semibold text-[#217346]">
                          {name}
                        </Link>
                        <p className="mt-0.5 truncate text-[11px] text-[#9CA3AF]">
                          {[p.variety, p.category].filter(Boolean).join(" · ") || "—"}
                        </p>
                        <p className="mt-0.5 break-all font-mono text-[10px] text-emerald-700">{formatProductBusinessId(p)}</p>
                        <p className="mt-1.5 text-[13px] font-bold text-[#1F2937]">
                          {qty.toLocaleString("en-IN")} {p.unit || "Kg"}
                        </p>
                      </div>
                      <div className="flex w-[108px] shrink-0 flex-col items-stretch gap-1">
                        <span className="self-end rounded bg-green-50 px-1.5 py-0.5 text-center text-[10px] font-semibold text-green-700">
                          {p.status || "Active"}
                        </span>
                        <Link to={productFarmersPath(p)} className={`${ACTION_BTN} w-full`}>
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                    {["Product", "Product ID", "Qty", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">
                        {h}
                      </th>
                    ))}
                    <th className="sticky right-0 z-20 border-l border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-right font-semibold text-[#6B7280]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {availableProducts.map((p) => {
                    const id = p.id || p.productId;
                    const name = productNameOf(p);
                    const qty = productQty(p);
                    return (
                      <tr key={id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                        <td className="px-3 py-2">
                          <Link to={productFarmersPath(p)} className="font-semibold text-[#217346] hover:underline">
                            {name}
                          </Link>
                          <p className="text-[10px] text-[#9CA3AF]">
                            {[p.variety, p.category].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-emerald-700">{formatProductBusinessId(p)}</td>
                        <td className="px-3 py-2 font-semibold">
                          {qty} {p.unit || "Kg"}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                            {p.status || "Active"}
                          </span>
                        </td>
                        <td className="sticky right-0 z-10 whitespace-nowrap border-l border-[#D4D4D4] bg-white px-3 py-2 text-right">
                          <Link to={productFarmersPath(p)} className={ACTION_BTN}>
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filteredOrders.length === 0 ? (
        <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>
          {orders.length === 0
            ? "No harvest orders yet. Use Create Order by Product to add one."
            : dateFrom || dateTo || q
              ? "No orders for this date / search."
              : "No orders in this filter."}
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[920px] border-collapse text-[10px] sm:text-[11px]">
            <colgroup>
              <col className="w-10" />
              <col className="w-[13.5rem]" />
              <col className="w-[7.5rem]" />
              <col className="w-[7rem]" />
              <col className="w-[5.5rem]" />
              <col className="w-[5.5rem]" />
              <col className="w-[5rem]" />
              {gradeColumns.map((g) => (
                <Fragment key={`col-${g}`}>
                  <col className="w-[4.5rem]" />
                  <col className="w-[4.5rem]" />
                </Fragment>
              ))}
              <col className="w-[6.5rem]" />
            </colgroup>
            <thead>
              <tr>
                <th className={TH} rowSpan={2}>
                  #
                </th>
                <th className={TH} rowSpan={2}>
                  Order ID
                </th>
                <th className={TH} rowSpan={2}>
                  Product
                </th>
                <th className={TH} rowSpan={2}>
                  Farmer
                </th>
                <th className={TH} rowSpan={2}>
                  Order Date
                </th>
                <th className={TH} rowSpan={2}>
                  Pickup Date
                </th>
                <th className={TH} rowSpan={2}>
                  Pickup Time
                </th>
                {gradeColumns.map((g) => {
                  const tone = gradeTone(g);
                  return (
                    <th
                      key={g}
                      className={`border px-0.5 py-1.5 text-center text-[9px] font-bold leading-tight sm:text-[10px] ${tone.head}`}
                      colSpan={2}
                    >
                      {g}
                    </th>
                  );
                })}
                <th className={TH} rowSpan={2}>
                  Actions
                </th>
              </tr>
              <tr>
                {gradeColumns.map((g) => {
                  const tone = gradeTone(g);
                  const sub = `border px-0.5 py-1 text-center text-[9px] font-semibold ${tone.head}`;
                  return (
                    <Fragment key={`h-${g}`}>
                      <th className={sub}>Qty</th>
                      <th className={sub}>Rate</th>
                    </Fragment>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, idx) => {
                const entry = orderProductEntry(order);
                const id = order.id || order.orderId;
                const farmerName =
                  order.farmerName || farmers.find((f) => f.id === order.farmerId)?.name || "—";
                const map = gradeDetailMap(order);
                const unit = entry.unit || order.unit || "Kg";
                const variety = entry.variety;
                return (
                  <tr key={id} className="hover:bg-[#F9FBF9]">
                    <td className={`${TD} text-center text-[#9CA3AF]`}>{idx + 1}</td>
                    <td className={`${TD} whitespace-nowrap font-mono text-[10px] font-semibold text-[#217346] sm:text-[11px]`}>
                      <Link to={orderViewPath(order)} className="hover:underline" title={id}>
                        {id}
                      </Link>
                    </td>
                    <td className={TD} title={[entry.productName, variety].filter(Boolean).join(" · ")}>
                      <span className="block font-semibold text-[#1F2937]">{entry.productName}</span>
                      {variety ? <span className="mt-0.5 block text-[9px] leading-tight text-[#6B7280]">{variety}</span> : null}
                    </td>
                    <td className={`${TD} whitespace-nowrap`} title={farmerName}>
                      {farmerName}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-center`}>
                      {shortDate(order.orderDate || order.harvestDate || order.date || order.createdAt)}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-center`}>{shortDate(order.pickupDate)}</td>
                    <td className={`${TD} whitespace-nowrap text-center`}>{formatTime12h(order.pickupTime)}</td>
                    {gradeColumns.map((g) => {
                      const row = map[g] || { qty: 0, rate: 0, unit };
                      const tone = gradeTone(g);
                      const cell = `border px-0.5 py-1.5 text-center text-[10px] tabular-nums sm:text-[11px] ${tone.cell}`;
                      return (
                        <Fragment key={`${id}-${g}`}>
                          <td className={cell}>{formatQty(row.qty, row.unit || unit)}</td>
                          <td className={cell}>{formatRate(row.rate, row.qty)}</td>
                        </Fragment>
                      );
                    })}
                    <td className={`${TD} bg-white px-0.5 py-1 align-middle sm:px-1`}>
                      <div className="mx-auto flex w-full max-w-[7.5rem] items-stretch justify-center gap-1">
                        <Link to={orderViewPath(order)} className={ACTION_BTN}>
                          View
                        </Link>
                        <button
                          type="button"
                          className={ACTION_BTN_DANGER}
                          disabled={deletingId === id || !order.farmerId}
                          onClick={() => handleDeleteOrder(order)}
                          title="Delete order"
                        >
                          {deletingId === id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
