import { Fragment, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  deleteManagerFarmerOrder,
  getManagerAllHarvestOrders,
  getManagerAllProducts,
} from "../../api/managerPortApi";
import { staffApi } from "../../api/staffApi";
import { useInventoryRequests } from "../../hooks/useInventoryRequests";
import { useLive } from "../../realtime/useLive";
import {
  formatMoney,
  formatOrderDate,
  managerOrderBucket,
  matchesManagerOrderFilter,
  matchesOrderDateRange,
  todayISODate,
  yesterdayISODate,
} from "../../utils/orderDisplay";
import { formatProductBusinessId } from "../../utils/cropLinks";
import {
  extractProductGradeAndStock,
  isBusinessProductId,
  matchesViewedProduct,
  productFarmersPath,
  productGroupKey,
  productNameOf,
  productQty,
  summarizeProductRows,
} from "../../utils/productList";
import CopyId, { CopyButton } from "../../components/ui/CopyId";
import { isPendingProductApproval } from "../../utils/productActions";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Layers,
  ListOrdered,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Tractor,
  Trash2,
  XCircle,
} from "lucide-react";

const ACTION_BASE =
  "inline-flex h-6 min-w-[2.75rem] flex-1 items-center justify-center rounded px-1 text-[9px] font-semibold leading-none whitespace-nowrap";
const ACTION_BTN = `${ACTION_BASE} border border-[#D4D4D4] bg-white text-[#1F2937] hover:bg-[#F3F4F6]`;

const ORDER_TYPE_FARMER = "farmer";
const ORDER_TYPE_PRODUCTS = "products";
const ORDER_TYPE_DARKSTORE = "darkstore";

const DARKSTORE_VIEW_ALL = "all";
const DARKSTORE_VIEW_PRODUCTS = "products";
const DARKSTORE_VIEW_STORES = "stores";

const TAB_STATEMENTS = "statements";
const TAB_BY_PRODUCT = "by-product";
const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

const DARKSTORE_TABS = [
  { id: "all", label: "All Requests" },
  { id: "pending", label: "Pending Review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

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

function formatWhen(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(value);
  }
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

function isAvailableForOrder(product) {
  const status = String(product?.status || "").trim();
  if (!status) return true;
  if (isPendingProductApproval(status)) return false;
  if (status === "Draft" || status === "Rejected" || status === "Paused") return false;
  return true;
}

function groupProductsByBusinessId(items = []) {
  const map = new Map();
  const seenDocIds = new Set();

  for (const p of items) {
    const docId = p._id || p.id;
    if (docId && seenDocIds.has(String(docId))) {
      continue;
    }

    const targetProductId =
      [p.productId, p.id].find((v) => isBusinessProductId(v)) || p.productId || p.id || "";
    const targetKey = productGroupKey(p);
    const targetName = productNameOf(p);

    const bizId = formatProductBusinessId(p);
    const groupKey = (bizId && isBusinessProductId(bizId) ? bizId : targetKey).toUpperCase();

    if (map.has(groupKey)) {
      if (docId) seenDocIds.add(String(docId));
      continue;
    }

    // Match all farmer listings for this product identically to VendorProductFarmersPage
    const matchingRows = items.filter((item) =>
      matchesViewedProduct(item, {
        productId: targetProductId,
        productName: targetName,
        productKey: targetKey,
      })
    );

    const rowsToSummarize = matchingRows.length > 0 ? matchingRows : [p];
    rowsToSummarize.forEach((r) => {
      const id = r._id || r.id;
      if (id) seenDocIds.add(String(id));
    });

    const summary = summarizeProductRows(rowsToSummarize);

    const primary =
      rowsToSummarize.find((item) => item.status === "Active" || item.status === "Approved") ||
      rowsToSummarize[0] ||
      p;

    map.set(groupKey, {
      ...primary,
      businessProductId: bizId || targetProductId || groupKey,
      listings: rowsToSummarize,
      farmerCount: new Set(rowsToSummarize.map((r) => r.farmerId).filter(Boolean)).size,
      grades: summary.grades,
      gradeA: summary.gradeA,
      gradeB: summary.gradeB,
      gradeC: summary.gradeC,
      gradesTotal: summary.gradesTotal,
      totalQty: summary.totalQty,
    });
  }

  return Array.from(map.values());
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
  return `/vendor/orders/detail/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`;
}

function orderFormPath(order, mode) {
  const id = order.id || order.orderId;
  const params = new URLSearchParams();
  if (order.farmerId) params.set("farmerId", order.farmerId);
  const productId = order.productId || order.products?.[0]?.productId || order.products?.[0]?.id || "";
  if (productId) params.set("productId", productId);
  params.set(mode, id);
  return `/vendor/orders/create?${params.toString()}`;
}

function orderProductInventoryPath(product) {
  const key = productGroupKey(product);
  const params = new URLSearchParams({ name: productNameOf(product) });
  const productId =
    [product.productId, product.id].find((v) => isBusinessProductId(v)) ||
    product.productId ||
    product.id ||
    "";
  if (productId) params.set("productId", productId);
  return `/vendor/orders/products/${encodeURIComponent(key)}/inventory?${params.toString()}`;
}

function OrderActionButtons({ order, onDelete, deleting, size = "sm" }) {
  const named = size === "lg";
  const icon = "h-3.5 w-3.5";
  const btn = named
    ? "inline-flex h-7 shrink-0 items-center justify-center gap-0.5 rounded-md border border-[#D4D4D4] bg-white px-1.5 text-[10px] font-semibold text-[#1F2937] hover:bg-[#F3F4F6]"
    : "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#D4D4D4] bg-white text-[#1F2937] hover:bg-[#F3F4F6]";
  const danger = named
    ? "inline-flex h-7 shrink-0 items-center justify-center gap-0.5 rounded-md border border-red-200 bg-red-50 px-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
    : "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50";
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1">
      <Link to={orderViewPath(order)} className={btn} title="View" aria-label="View">
        {named ? <span>View</span> : <Eye className={icon} />}
      </Link>
      <Link to={orderFormPath(order, "edit")} className={btn} title="Edit" aria-label="Edit">
        {named ? <span>Edit</span> : <Pencil className={icon} />}
      </Link>
      <button
        type="button"
        className={danger}
        disabled={deleting || !order.farmerId}
        onClick={() => onDelete(order)}
        title="Delete"
        aria-label="Delete"
      >
        {named ? <span>Delete</span> : <Trash2 className={icon} />}
      </button>
    </div>
  );
}

function productGradeMap(product) {
  const unit = product?.unit || "Kg";
  const { grades } = extractProductGradeAndStock(product);
  const map = {};

  grades.forEach((g) => {
    if (g.quantity > 0) {
      map[g.label] = {
        qty: g.quantity,
        rate: g.rate || Number(product?.pricePerKg || product?.sellingPrice || 0),
        unit,
      };
    }
  });

  return map;
}

function gradeColumnList(map) {
  const extras = Object.keys(map).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
  return [...DEFAULT_GRADES, ...extras];
}

function GradeMiniTable({ map, unit }) {
  const columns = gradeColumnList(map);
  const hasAnyGradeQty = columns.some((g) => (map[g]?.qty || 0) > 0);
  if (!hasAnyGradeQty) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-md border border-[#E5E7EB]">
      <div className="grid grid-cols-[1.1fr_1fr_1fr] bg-[#F8FAF8] px-2 py-1 text-[10px] font-bold text-[#6B7280]">
        <span>Grade</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Rate</span>
      </div>
      {columns.map((g) => {
        const row = map[g] || { qty: 0, rate: 0, unit };
        const tone = gradeTone(g);
        return (
          <div
            key={g}
            className={`grid grid-cols-[1.1fr_1fr_1fr] items-center border-t border-[#E5E7EB] px-2 py-1.5 text-[12px] ${tone.cell}`}
          >
            <span className="font-semibold text-[#1F2937]">{g}</span>
            <span className="text-right font-semibold tabular-nums">
              {row.qty > 0 ? formatQty(row.qty, row.unit || unit) : "—"}
            </span>
            <span className="text-right font-semibold tabular-nums">{formatRate(row.rate, row.qty)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProductMobileCard({ product }) {
  const name = productNameOf(product);
  const unit = product.unit || "Kg";
  const map = productGradeMap(product);
  const total = Number(
    product.totalQty ??
    (Number(product.gradeA || 0) + Number(product.gradeB || 0) + Number(product.gradeC || 0)) ??
    productQty(product) ??
    0
  );
  return (
    <div className="px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="min-w-0 truncate text-[13px] font-bold text-[#217346]">
          {name}
          {product.variety ? <span className="font-semibold text-[#6B7280]"> · {product.variety}</span> : null}
        </p>
        <CopyId
          value={formatProductBusinessId(product)}
          className="min-w-0 flex-1"
          textClassName="font-mono text-[10px] text-emerald-700"
        />
        <span className="shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
          {product.status || "Active"}
        </span>
      </div>
      <GradeMiniTable map={map} unit={unit} />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-semibold text-[#6B7280]">Total Qty: </span>
          <span className="text-[13px] font-bold text-[#1F2937]">
            {total.toLocaleString("en-IN")} {unit}
          </span>
        </div>
        <Link to={orderProductInventoryPath(product)} className={`${ACTION_BTN} !h-8 !min-w-[4.5rem] !text-[11px]`}>
          View
        </Link>
      </div>
    </div>
  );
}

function OrderMobileCard({ order, farmerName, onDelete, deleting }) {
  const entry = orderProductEntry(order);
  const id = order.id || order.orderId;
  const map = gradeDetailMap(order);
  const unit = entry.unit || order.unit || "Kg";
  const value = Number(order.orderValue || order.totalAmount || order.amount || entry.amount || 0);
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="min-w-0 truncate text-[13px] font-bold text-[#1F2937]">
          {entry.productName}
          {entry.variety ? <span className="font-semibold text-[#6B7280]"> · {entry.variety}</span> : null}
        </p>
        <CopyId
          value={id}
          className="min-w-0 flex-1"
          textClassName="font-mono text-[10px] text-emerald-700"
        />
        <StatusBadge status={order.status} className="shrink-0" />
      </div>
      <p className="mt-1 truncate text-[11px] text-[#6B7280]">
        Farmer <span className="font-semibold text-[#1F2937]">{farmerName}</span>
      </p>
      <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2 text-[11px] text-[#6B7280]">
        <span>
          Order{" "}
          <span className="font-semibold text-[#1F2937]">
            {shortDate(order.orderDate || order.harvestDate || order.date || order.createdAt)}
          </span>
        </span>
        <span>
          Pickup <span className="font-semibold text-[#1F2937]">{shortDate(order.pickupDate)}</span>
        </span>
        <span>
          Time <span className="font-semibold text-[#1F2937]">{formatTime12h(order.pickupTime)}</span>
        </span>
      </div>
      <GradeMiniTable map={map} unit={unit} />
      <div className="mt-2 flex min-w-0 flex-nowrap items-center justify-between gap-1.5">
        <p className="min-w-0 shrink truncate text-[12px] font-semibold text-[#6B7280]">
          Value <span className="font-bold text-[#1F2937]">{formatMoney(value)}</span>
        </p>
        <OrderActionButtons order={order} onDelete={onDelete} deleting={deleting} size="lg" />
      </div>
    </article>
  );
}

function OrdersNavRow({ tab, statusFilter, onTab, onStatus, counts, onByProduct }) {
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
        onClick={() => {
          if (onByProduct) onByProduct();
          else onTab(TAB_BY_PRODUCT);
        }}
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



function DarkstoreStoreCard({ store, onReview, busyId }) {
  const [expanded, setExpanded] = useState(true);

  // Group this dark store's requests product-wise
  const productGroups = useMemo(() => {
    const map = new Map();
    (store.requests || []).forEach((req) => {
      const key = String(req.sku || req.productName || "item").trim();
      if (!map.has(key)) {
        map.set(key, {
          key,
          sku: req.sku,
          productName: req.productName,
          category: req.category || "General",
          unit: req.unit || "pcs",
          currentStock: req.currentStock ?? 0,
          totalQuantity: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          requests: [],
        });
      }
      const prod = map.get(key);
      const qty = Number(req.quantity || 0);
      prod.totalQuantity += qty;
      if (req.status === "pending") prod.pendingCount += 1;
      else if (req.status === "approved") prod.approvedCount += 1;
      else if (req.status === "rejected") prod.rejectedCount += 1;
      prod.requests.push(req);
    });
    return Array.from(map.values());
  }, [store.requests]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:shadow-sm">
      {/* Darkstore Summary Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-blue-800">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">{store.storeName}</h3>
              {store.area || store.city ? (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {[store.area, store.city].filter(Boolean).join(", ")}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Manager: <span className="font-semibold text-slate-700">{store.managerName}</span> ·{" "}
              <span className="font-semibold text-emerald-800">{productGroups.length} Product{productGroups.length > 1 ? "s" : ""}</span> ·{" "}
              <span>{store.requests.length} Order Request{store.requests.length > 1 ? "s" : ""}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-base font-bold text-slate-900 sm:text-lg">
              {store.totalUnits.toLocaleString("en-IN")} Units
            </p>
            <div className="flex items-center justify-end gap-1.5 text-[10px]">
              {store.pendingCount > 0 ? (
                <span className="font-semibold text-amber-600">{store.pendingCount} Pending</span>
              ) : null}
              {store.approvedCount > 0 ? (
                <span className="font-semibold text-emerald-600">· {store.approvedCount} Approved</span>
              ) : null}
              {store.rejectedCount > 0 ? (
                <span className="font-semibold text-rose-600">· {store.rejectedCount} Rejected</span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            title={expanded ? "Collapse" : "Expand"}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Product-wise Orders within this Darkstore */}
      {expanded ? (
        <div className="mt-4 space-y-3.5">
          {productGroups.map((product) => (
            <div
              key={product.key}
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 sm:p-4 transition hover:border-slate-300"
            >
              {/* Product Header */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {product.productName}
                      </h4>
                      {product.category ? (
                        <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {product.category}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span>SKU: <strong className="text-slate-700">{product.sku}</strong></span>
                      <span className="font-sans text-slate-400">·</span>
                      <span className="font-sans text-slate-600">
                        Stock in store: <strong className="text-slate-800">{product.currentStock} {product.unit}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs sm:text-sm font-bold text-emerald-800">
                    Total Req: {product.totalQuantity} {product.unit}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
                    <span>{product.requests.length} order{product.requests.length > 1 ? "s" : ""}</span>
                    {product.pendingCount > 0 ? (
                      <span className="font-bold text-amber-600">· {product.pendingCount} Pending</span>
                    ) : null}
                    {product.approvedCount > 0 ? (
                      <span className="font-semibold text-emerald-600">· {product.approvedCount} Approved</span>
                    ) : null}
                    {product.rejectedCount > 0 ? (
                      <span className="font-semibold text-rose-600">· {product.rejectedCount} Rejected</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Product Orders Table */}
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full min-w-[580px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2 pr-3">Request #</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Note</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 pl-3 text-right">Actions / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/70">
                    {product.requests.map((req) => {
                      const id = req.id || req._id;
                      const isPending = req.status === "pending";
                      return (
                        <tr key={id} className="hover:bg-emerald-50/30 transition">
                          <td className="py-2.5 pr-3 font-mono font-bold text-emerald-800 text-[11px] whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              {req.requestNumber}
                              <CopyButton value={req.requestNumber} />
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            <span className="text-emerald-700">{req.quantity} {req.unit || product.unit}</span>
                            <span className="block text-[9px] font-normal text-slate-400">had {req.currentStock ?? 0}</span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                            {formatWhen(req.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-[200px]">
                            {req.note ? (
                              <span className="italic text-slate-600">“{req.note}”</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={Boolean(busyId)}
                                  onClick={() => onReview(id, "approved")}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>{busyId === `${id}-approved` ? "…" : "Approve"}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={Boolean(busyId)}
                                  onClick={() => onReview(id, "rejected")}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>{busyId === `${id}-rejected` ? "…" : "Reject"}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">
                                {req.reviewedByName ? `By ${req.reviewedByName}` : "—"}
                                {req.reviewNote ? ` (${req.reviewNote})` : ""}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ManagerOrdersPage({ mode: modeProp }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const detectedType =
    modeProp ||
    (location.pathname.endsWith("/darkstore")
      ? ORDER_TYPE_DARKSTORE
      : location.pathname.endsWith("/products") || location.pathname.endsWith("/by-product")
        ? ORDER_TYPE_PRODUCTS
        : location.pathname.endsWith("/farmer")
          ? ORDER_TYPE_FARMER
          : null);

  const orderType =
    detectedType ||
    (searchParams.get("type") === ORDER_TYPE_DARKSTORE
      ? ORDER_TYPE_DARKSTORE
      : searchParams.get("type") === ORDER_TYPE_PRODUCTS
        ? ORDER_TYPE_PRODUCTS
        : ORDER_TYPE_FARMER);

  // Farmer orders state
  const tab = searchParams.get("tab") === TAB_BY_PRODUCT ? TAB_BY_PRODUCT : TAB_STATEMENTS;
  const rawStatus = searchParams.get("status");
  const statusFilter = ["pending", "accepted", "rejected"].includes(rawStatus) ? rawStatus : "all";
  const dateFrom = searchParams.get("from") || "";
  const dateTo = searchParams.get("to") || "";
  const [farmers, setFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingFarmer, setLoadingFarmer] = useState(true);
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState("");

  // Darkstore orders state
  const darkstoreStatus = searchParams.get("ds_status") || "all";
  const { requests: darkstoreRequests, loading: loadingDarkstore, error: errorDarkstore, reload: reloadDarkstore } = useInventoryRequests();
  const [busyReviewId, setBusyReviewId] = useState("");

  const setOrderType = (nextType) => {
    if (location.pathname.startsWith("/vendor/orders/")) {
      const search = searchParams.toString();
      navigate(`/vendor/orders/${nextType}${search ? `?${search}` : ""}`);
    } else {
      const nextParams = new URLSearchParams(searchParams);
      if (nextType === ORDER_TYPE_DARKSTORE) {
        nextParams.set("type", ORDER_TYPE_DARKSTORE);
      } else if (nextType === ORDER_TYPE_PRODUCTS) {
        nextParams.set("type", ORDER_TYPE_PRODUCTS);
      } else {
        nextParams.delete("type");
      }
      setSearchParams(nextParams, { replace: true });
    }
    setQ("");
  };

  const setDarkstoreStatusFilter = (nextStatus) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus === "all") {
      nextParams.delete("ds_status");
    } else {
      nextParams.set("ds_status", nextStatus);
    }
    setSearchParams(nextParams, { replace: true });
  };

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

  const handleReviewDarkstoreRequest = async (requestId, decision) => {
    setBusyReviewId(`${requestId}-${decision}`);
    try {
      const res = await staffApi.reviewInventoryRequest(requestId, { decision });
      toast.success(res.data?.message || `Request ${decision}`);
      await reloadDarkstore();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${decision} request`);
    } finally {
      setBusyReviewId("");
    }
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoadingFarmer(true);
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
      setLoadingFarmer(false);
    }
  };

  useLive(() => {
    loadData(true);
  }, []);

  // Farmer Order calculations
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

  const uniqueProducts = useMemo(() => groupProductsByBusinessId(products), [products]);

  const displayedProducts = useMemo(() => {
    const query = q.toLowerCase().trim();
    if (!query) return uniqueProducts;
    return uniqueProducts.filter((p) => {
      const busId = String(p.businessProductId || formatProductBusinessId(p) || p.productId || p.id || "").toLowerCase();
      return (
        busId.includes(query) ||
        productNameOf(p).toLowerCase().includes(query) ||
        String(p.variety || "").toLowerCase().includes(query) ||
        String(p.category || "").toLowerCase().includes(query) ||
        String(p.productId || p.id || "").toLowerCase().includes(query)
      );
    });
  }, [uniqueProducts, q]);

  const availableProducts = useMemo(() => {
    const query = q.toLowerCase().trim();
    return uniqueProducts.filter((p) => {
      if (!isAvailableForOrder(p)) return false;
      if (!query) return true;
      const busId = String(p.businessProductId || formatProductBusinessId(p) || p.productId || p.id || "").toLowerCase();
      return (
        busId.includes(query) ||
        productNameOf(p).toLowerCase().includes(query) ||
        String(p.variety || "").toLowerCase().includes(query) ||
        String(p.category || "").toLowerCase().includes(query) ||
        String(p.productId || p.id || "").toLowerCase().includes(query)
      );
    });
  }, [uniqueProducts, q]);

  // Darkstore calculations
  const darkstoreCounts = useMemo(() => ({
    all: darkstoreRequests.length,
    pending: darkstoreRequests.filter((r) => r.status === "pending").length,
    approved: darkstoreRequests.filter((r) => r.status === "approved").length,
    rejected: darkstoreRequests.filter((r) => r.status === "rejected").length,
  }), [darkstoreRequests]);

  const filteredDarkstoreRequests = useMemo(() => {
    const query = q.toLowerCase().trim();
    return darkstoreRequests
      .filter((r) => {
        if (darkstoreStatus === "all") return true;
        return r.status === darkstoreStatus;
      })
      .filter((r) => {
        if (!query) return true;
        return (
          String(r.requestNumber || "").toLowerCase().includes(query) ||
          String(r.storeName || "").toLowerCase().includes(query) ||
          String(r.managerName || "").toLowerCase().includes(query) ||
          String(r.productName || "").toLowerCase().includes(query) ||
          String(r.sku || "").toLowerCase().includes(query) ||
          String(r.city || "").toLowerCase().includes(query) ||
          String(r.area || "").toLowerCase().includes(query) ||
          String(r.note || "").toLowerCase().includes(query)
        );
      });
  }, [darkstoreRequests, darkstoreStatus, q]);


  // Darkstore Store-wise aggregation
  const darkstoreWiseOrders = useMemo(() => {
    const query = q.toLowerCase().trim();
    const map = new Map();

    darkstoreRequests.forEach((req) => {
      if (darkstoreStatus !== "all" && req.status !== darkstoreStatus) return;
      const key = String(req.managerId || req.storeName || "store").trim();
      if (!map.has(key)) {
        map.set(key, {
          key,
          storeName: req.storeName || "Dark Store",
          managerName: req.managerName || "Store Manager",
          city: req.city || "",
          area: req.area || "",
          totalUnits: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          requests: [],
        });
      }
      const store = map.get(key);
      store.totalUnits += Number(req.quantity || 0);
      if (req.status === "pending") store.pendingCount += 1;
      else if (req.status === "approved") store.approvedCount += 1;
      else if (req.status === "rejected") store.rejectedCount += 1;
      store.requests.push(req);
    });

    const list = Array.from(map.values());

    if (!query) return list;
    return list.filter(
      (s) =>
        s.storeName.toLowerCase().includes(query) ||
        s.managerName.toLowerCase().includes(query) ||
        s.city.toLowerCase().includes(query) ||
        s.area.toLowerCase().includes(query) ||
        s.requests.some(
          (r) =>
            String(r.productName || "").toLowerCase().includes(query) ||
            String(r.sku || "").toLowerCase().includes(query) ||
            String(r.requestNumber || "").toLowerCase().includes(query)
        )
    );
  }, [darkstoreRequests, darkstoreStatus, q]);

  return (
    <div className="min-w-0 space-y-3 p-4 sm:space-y-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#1F2937] sm:text-2xl">
            {orderType === ORDER_TYPE_PRODUCTS
              ? "Order By Products"
              : orderType === ORDER_TYPE_FARMER
                ? "Farmer Orders"
                : "Darkstore Orders"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {orderType === ORDER_TYPE_FARMER || orderType === ORDER_TYPE_PRODUCTS ? (
            <Link
              to="/vendor/orders/create"
              className={`${EXCEL_BTN_PRIMARY} inline-flex items-center gap-1.5 !min-h-9 px-3.5 py-1.5 text-xs font-semibold sm:!min-h-10 sm:text-sm`}
            >
              <Plus className="h-4 w-4" />
              <span>Create Order</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => reloadDarkstore()}
              className={`${EXCEL_BTN} inline-flex items-center gap-1.5 !min-h-9 px-3 py-1.5 text-xs font-semibold sm:!min-h-10`}
              title="Refresh Darkstore Requests"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingDarkstore ? "animate-spin text-emerald-700" : ""}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION: ORDER BY PRODUCTS CONTENT                       */}
      {/* ========================================================= */}
      {orderType === ORDER_TYPE_PRODUCTS ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {[
              { label: "Available Products", value: availableProducts.length, color: "text-[#217346]" },
              { label: "All Products", value: uniqueProducts.length, color: "text-emerald-700" },
            ].map((s) => (
              <div key={s.label} className={`${EXCEL_PANEL} px-2.5 py-1.5 sm:px-3 sm:py-2`}>
                <p className="text-[10px] text-[#6B7280]">{s.label}</p>
                <p className={`text-sm font-bold sm:text-base ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product or ID…"
              className={`${EXCEL_INPUT} w-full !py-2 !text-xs sm:max-w-xs sm:!py-1.5`}
            />
          </div>

          {loadingFarmer ? (
            <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>Loading products…</div>
          ) : displayedProducts.length === 0 ? (
            <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>
              No products found.
            </div>
          ) : (
            <div className={EXCEL_PANEL}>
              <div className="divide-y divide-[#E5E7EB] sm:hidden">
                {displayedProducts.map((p) => (
                  <ProductMobileCard key={p.businessProductId || p.id || p.productId} product={p} />
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[760px] text-xs">
                  <thead>
                    <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                      <th className="px-3 py-2 font-semibold text-[#6B7280]">Product</th>
                      <th className="px-3 py-2 font-semibold text-[#6B7280]">Product ID</th>
                      <th className="border-l border-[#D4D4D4] bg-[#D1FAE5]/60 px-3 py-2 text-center font-bold text-[#065F46]">
                        Grade A
                      </th>
                      <th className="border-l border-[#D4D4D4] bg-[#DBEAFE]/60 px-3 py-2 text-center font-bold text-[#1E40AF]">
                        Grade B
                      </th>
                      <th className="border-l border-[#D4D4D4] bg-[#FEF3C7]/60 px-3 py-2 text-center font-bold text-[#92400E]">
                        Grade C
                      </th>
                      <th className="border-l border-[#D4D4D4] bg-[#E8F5E9] px-3 py-2 text-right font-bold text-[#1F2937]">
                        Total Qty
                      </th>
                      <th className="border-l border-[#D4D4D4] px-3 py-2 text-center font-semibold text-[#6B7280]">
                        Status
                      </th>
                      <th className="sticky right-0 z-20 border-l border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-right font-semibold text-[#6B7280]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProducts.map((p) => {
                      const id = p.businessProductId || p.id || p.productId;
                      const name = productNameOf(p);
                      const unit = p.unit || "Kg";
                      const gA = Number(p.gradeA ?? 0);
                      const gB = Number(p.gradeB ?? 0);
                      const gC = Number(p.gradeC ?? 0);
                      const total = Number(p.totalQty ?? (gA + gB + gC));

                      return (
                        <tr key={id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                          <td className="px-3 py-2">
                            <Link to={orderProductInventoryPath(p)} className="font-semibold text-[#217346] hover:underline">
                              {name}
                            </Link>
                            <p className="text-[10px] text-[#9CA3AF]">
                              {[p.variety, p.category].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <CopyId value={formatProductBusinessId(p)} />
                          </td>
                          <td className="border-l border-[#E5E7EB] bg-[#ECFDF5]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#065F46]">
                            {gA > 0 ? `${gA.toLocaleString("en-IN")} ${unit}` : "—"}
                          </td>
                          <td className="border-l border-[#E5E7EB] bg-[#EFF6FF]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#1E40AF]">
                            {gB > 0 ? `${gB.toLocaleString("en-IN")} ${unit}` : "—"}
                          </td>
                          <td className="border-l border-[#E5E7EB] bg-[#FFFBEB]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#92400E]">
                            {gC > 0 ? `${gC.toLocaleString("en-IN")} ${unit}` : "—"}
                          </td>
                          <td className="border-l border-[#E5E7EB] bg-[#E8F5E9]/30 px-3 py-2 text-right font-bold tabular-nums text-[#1F2937]">
                            {total.toLocaleString("en-IN")} {unit}
                          </td>
                          <td className="border-l border-[#E5E7EB] px-3 py-2 text-center">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                p.status === "Approved" || p.status === "Active"
                                  ? "bg-green-50 text-green-700"
                                  : p.status === "Draft"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {p.status || "Active"}
                            </span>
                          </td>
                          <td className="sticky right-0 z-10 whitespace-nowrap border-l border-[#D4D4D4] bg-white px-3 py-2 text-right">
                            <Link to={orderProductInventoryPath(p)} className={ACTION_BTN}>
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
          )}
        </div>
      ) : orderType === ORDER_TYPE_FARMER ? (
        <div className="space-y-3">
          <OrdersNavRow
            tab={tab}
            statusFilter={statusFilter}
            onTab={setTab}
            onStatus={setStatusFilter}
            counts={statusCounts}
            onByProduct={() => navigate("/vendor/orders/products")}
          />

          {tab === TAB_BY_PRODUCT ? (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {[
                { label: "Available", value: availableProducts.length, color: "text-[#217346]" },
                { label: "All Products", value: uniqueProducts.length, color: "text-emerald-700" },
              ].map((s) => (
                <div key={s.label} className={`${EXCEL_PANEL} px-2.5 py-1.5 sm:px-3 sm:py-2`}>
                  <p className="text-[10px] text-[#6B7280]">{s.label}</p>
                  <p className={`text-sm font-bold sm:text-base ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Filters & Search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            {tab === TAB_STATEMENTS ? (
              <div className="flex min-w-0 flex-nowrap items-end gap-1 overflow-x-auto">
                <label className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateRange(e.target.value, dateTo)}
                    className={`${EXCEL_INPUT} min-w-0 !w-full !px-1.5 !py-1.5 !text-[11px]`}
                  />
                </label>
                <label className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">To</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateRange(dateFrom, e.target.value)}
                    className={`${EXCEL_INPUT} min-w-0 !w-full !px-1.5 !py-1.5 !text-[11px]`}
                  />
                </label>
                <button type="button" onClick={setTodayFilter} className={`${EXCEL_BTN} !min-h-8 shrink-0 !px-2 !text-[11px]`}>
                  Today
                </button>
                <button type="button" onClick={setYesterdayFilter} className={`${EXCEL_BTN} !min-h-8 shrink-0 !px-2 !text-[11px]`}>
                  Yesterday
                </button>
                {dateFrom || dateTo ? (
                  <button type="button" onClick={clearDateFilter} className={`${EXCEL_BTN} !min-h-8 shrink-0 !px-2 !text-[11px]`}>
                    Clear
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

          {loadingFarmer ? (
            <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>Loading farmer orders…</div>
          ) : tab === TAB_BY_PRODUCT ? (
            displayedProducts.length === 0 ? (
              <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>
                No products found.
              </div>
            ) : (
              <div className={EXCEL_PANEL}>
                <div className="divide-y divide-[#E5E7EB] sm:hidden">
                  {displayedProducts.map((p) => (
                    <ProductMobileCard key={p.businessProductId || p.id || p.productId} product={p} />
                  ))}
                </div>

                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[760px] text-xs">
                    <thead>
                      <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                        <th className="px-3 py-2 font-semibold text-[#6B7280]">Product</th>
                        <th className="px-3 py-2 font-semibold text-[#6B7280]">Product ID</th>
                        <th className="border-l border-[#D4D4D4] bg-[#D1FAE5]/60 px-3 py-2 text-center font-bold text-[#065F46]">
                          Grade A
                        </th>
                        <th className="border-l border-[#D4D4D4] bg-[#DBEAFE]/60 px-3 py-2 text-center font-bold text-[#1E40AF]">
                          Grade B
                        </th>
                        <th className="border-l border-[#D4D4D4] bg-[#FEF3C7]/60 px-3 py-2 text-center font-bold text-[#92400E]">
                          Grade C
                        </th>
                        <th className="border-l border-[#D4D4D4] bg-[#E8F5E9] px-3 py-2 text-right font-bold text-[#1F2937]">
                          Total Qty
                        </th>
                        <th className="border-l border-[#D4D4D4] px-3 py-2 text-center font-semibold text-[#6B7280]">
                          Status
                        </th>
                        <th className="sticky right-0 z-20 border-l border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-right font-semibold text-[#6B7280]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedProducts.map((p) => {
                        const id = p.businessProductId || p.id || p.productId;
                        const name = productNameOf(p);
                        const unit = p.unit || "Kg";
                        const gA = Number(p.gradeA ?? 0);
                        const gB = Number(p.gradeB ?? 0);
                        const gC = Number(p.gradeC ?? 0);
                        const total = Number(p.totalQty ?? (gA + gB + gC));

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
                            <td className="px-3 py-2">
                              <CopyId value={formatProductBusinessId(p)} />
                            </td>
                            <td className="border-l border-[#E5E7EB] bg-[#ECFDF5]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#065F46]">
                              {gA > 0 ? `${gA.toLocaleString("en-IN")} ${unit}` : "—"}
                            </td>
                            <td className="border-l border-[#E5E7EB] bg-[#EFF6FF]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#1E40AF]">
                              {gB > 0 ? `${gB.toLocaleString("en-IN")} ${unit}` : "—"}
                            </td>
                            <td className="border-l border-[#E5E7EB] bg-[#FFFBEB]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#92400E]">
                              {gC > 0 ? `${gC.toLocaleString("en-IN")} ${unit}` : "—"}
                            </td>
                            <td className="border-l border-[#E5E7EB] bg-[#E8F5E9]/30 px-3 py-2 text-right font-bold tabular-nums text-[#1F2937]">
                              {total.toLocaleString("en-IN")} {unit}
                            </td>
                            <td className="border-l border-[#E5E7EB] px-3 py-2 text-center">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  p.status === "Approved" || p.status === "Active"
                                    ? "bg-green-50 text-green-700"
                                    : p.status === "Draft"
                                      ? "bg-slate-100 text-slate-700"
                                      : "bg-amber-50 text-amber-700"
                                }`}
                              >
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
            <>
              <div className="space-y-2.5 md:hidden">
                {filteredOrders.map((order) => {
                  const farmerName =
                    order.farmerName || farmers.find((f) => f.id === order.farmerId)?.name || "—";
                  const id = order.id || order.orderId;
                  return (
                    <OrderMobileCard
                      key={id}
                      order={order}
                      farmerName={farmerName}
                      deleting={deletingId === id}
                      onDelete={handleDeleteOrder}
                    />
                  );
                })}
              </div>
              <div className="hidden w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm md:block">
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
                          <td className={`${TD} whitespace-nowrap sm:text-[11px]`}>
                            <span className="inline-flex max-w-full items-center gap-0.5">
                              <Link
                                to={orderViewPath(order)}
                                className="truncate font-mono text-[10px] font-semibold text-[#217346] hover:underline sm:text-[11px]"
                                title={id}
                              >
                                {id}
                              </Link>
                              <CopyButton value={id} />
                            </span>
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
                            <OrderActionButtons order={order} onDelete={handleDeleteOrder} deleting={deletingId === id} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* TAB 2: DARKSTORE ORDERS CONTENT                           */
        /* ========================================================= */
        <div className="space-y-3">
          {/* Darkstore Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-500">Total Darkstore Orders</p>
              <p className="mt-1 text-lg font-bold text-slate-800 sm:text-2xl">{darkstoreCounts.all}</p>
            </div>
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 shadow-xs">
              <p className="text-[11px] font-semibold text-amber-700">Pending Review</p>
              <p className="mt-1 text-lg font-bold text-amber-900 sm:text-2xl">{darkstoreCounts.pending}</p>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 shadow-xs">
              <p className="text-[11px] font-semibold text-emerald-700">Approved / Restocked</p>
              <p className="mt-1 text-lg font-bold text-emerald-900 sm:text-2xl">{darkstoreCounts.approved}</p>
            </div>
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-3 shadow-xs">
              <p className="text-[11px] font-semibold text-rose-700">Rejected</p>
              <p className="mt-1 text-lg font-bold text-rose-900 sm:text-2xl">{darkstoreCounts.rejected}</p>
            </div>
          </div>

          {/* Darkstore View Header & Quick Status Sub-Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                <Store className="h-3.5 w-3.5 text-blue-400" />
                <span>Darkstores ({darkstoreWiseOrders.length})</span>
              </span>
              <span className="hidden text-xs text-slate-500 sm:inline">
                Orders organized by Darkstore &amp; Product
              </span>
            </div>

            {/* Quick Status Sub-Filter */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {DARKSTORE_TABS.map((t) => {
                const active = darkstoreStatus === t.id;
                const count = darkstoreCounts[t.id] || 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDarkstoreStatusFilter(t.id)}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                      active
                        ? "bg-emerald-100 text-emerald-900 font-bold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {t.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dark store, manager, product, SKU, request #…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50 sm:text-sm"
            />
          </div>

          {/* Content state */}
          {loadingDarkstore ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              Loading darkstore orders…
            </div>
          ) : errorDarkstore ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {errorDarkstore}
            </div>
          ) : darkstoreWiseOrders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              {darkstoreRequests.length === 0
                ? "No dark store restock orders yet. When a Delivery Manager requests stock, it appears here."
                : q
                  ? "No dark store orders match your search."
                  : "No dark store orders in this tab."}
            </div>
          ) : (
            <div className="space-y-4">
              {darkstoreWiseOrders.map((store) => (
                <DarkstoreStoreCard
                  key={store.key}
                  store={store}
                  onReview={handleReviewDarkstoreRequest}
                  busyId={busyReviewId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
