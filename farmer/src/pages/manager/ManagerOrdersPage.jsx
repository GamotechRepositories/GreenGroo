import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getManagerAllHarvestOrders, getManagerAllProducts } from "../../api/farmerApi";
import { usePolling } from "../../hooks/usePolling";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  canonicalOrderStatus,
  formatMoney,
  formatOrderDate,
  managerOrderBucket,
  matchesManagerOrderFilter,
  matchesOrderDateRange,
  rejectionText,
  todayISODate,
  yesterdayISODate,
} from "../../utils/orderDisplay";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { isPendingProductApproval } from "../../utils/productActions";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

const ACTION_BTN =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50 sm:h-7 sm:rounded-md sm:px-2 sm:text-[10px]";

const TAB_STATEMENTS = "statements";
const TAB_BY_PRODUCT = "by-product";

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
    quantity: Number(order.totalQuantity || order.orderedQuantity || 0) || qtyFromGrades || qtyFromProducts,
    amount: Number(order.totalAmount || order.orderValue || order.amount || 0),
    unit: order.unit || first.unit || "Kg",
    category: order.category || first.category || "",
  };
}

function orderSheetPath(order) {
  const entry = orderProductEntry(order);
  const key = productKeyOf({ productId: entry.productId, productName: entry.productName });
  const params = new URLSearchParams({ name: entry.productName || "" });
  if (entry.productId) params.set("productId", entry.productId);
  if (order.farmerId) params.set("farmerId", order.farmerId);
  return `/farmer/manager/orders/product/${encodeURIComponent(key)}?${params.toString()}`;
}

function sheetActionLabel(order) {
  const bucket = managerOrderBucket(order?.status);
  if (bucket === "accepted") return "Accepted Sheet";
  if (bucket === "rejected") return "Rejected Sheet";
  return "Sheet";
}

function sheetActionPath(order) {
  const bucket = managerOrderBucket(order?.status);
  if (bucket === "accepted") return "/farmer/manager/orders/accepted";
  if (bucket === "rejected") return "/farmer/manager/orders/rejected";
  return orderSheetPath(order);
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

function rowTone(status) {
  const bucket = managerOrderBucket(status);
  if (bucket === "rejected") return "bg-red-50/40";
  if (bucket === "pending") return "bg-sky-50/30";
  if (bucket === "accepted") return "bg-emerald-50/20";
  return "";
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
        <div className={EXCEL_PANEL}>
          <div className="divide-y divide-[#E5E7EB] sm:hidden">
            {filteredOrders.map((order) => {
              const entry = orderProductEntry(order);
              const id = order.id || order.orderId;
              const status = canonicalOrderStatus(order.status);
              const farmerName =
                order.farmerName || farmers.find((f) => f.id === order.farmerId)?.name || "—";
              const reason = rejectionText(order);
              return (
                <div key={id} className={`px-3 py-2.5 ${rowTone(status)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-bold text-[#217346]">{id}</p>
                      <p className="mt-0.5 truncate text-[13px] font-semibold text-[#1F2937]">{entry.productName}</p>
                      <p className="mt-0.5 text-[11px] text-[#6B7280]">{farmerName}</p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1 text-[11px]">
                    <div>
                      <p className="text-[#6B7280]">Qty</p>
                      <p className="font-bold">
                        {entry.quantity.toLocaleString("en-IN")} {entry.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Value</p>
                      <p className="font-bold text-[#217346]">{formatMoney(entry.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Date</p>
                      <p className="font-bold">{formatOrderDate(order.orderDate || order.harvestDate || order.date)}</p>
                    </div>
                  </div>
                  {reason ? <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{reason}</p> : null}
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <Link to={sheetActionPath(order)} className={`${ACTION_BTN} w-full`}>
                      {sheetActionLabel(order)}
                    </Link>
                    {order.farmerId ? (
                      <Link to={`/farmer/manager/orders/farmer/${order.farmerId}`} className={`${ACTION_BTN} w-full`}>
                        Farmer
                      </Link>
                    ) : (
                      <span className={`${ACTION_BTN} w-full opacity-40`}>Farmer</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                  {["Order ID", "Product", "Farmer", "Qty", "Value", "Date", "Status"].map((h) => (
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
                {filteredOrders.map((order) => {
                  const entry = orderProductEntry(order);
                  const id = order.id || order.orderId;
                  const status = canonicalOrderStatus(order.status);
                  const farmerName =
                    order.farmerName || farmers.find((f) => f.id === order.farmerId)?.name || "—";
                  const reason = rejectionText(order);
                  return (
                    <tr key={id} className={`border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9] ${rowTone(status)}`}>
                      <td className="px-3 py-2 font-mono font-semibold text-[#217346]">{id}</td>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-[#1F2937]">{entry.productName}</p>
                        {entry.productId ? (
                          <p className="font-mono text-[10px] text-emerald-700">{entry.productId}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{farmerName}</td>
                      <td className="px-3 py-2 font-semibold">
                        {entry.quantity.toLocaleString("en-IN")} {entry.unit}
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#217346]">{formatMoney(entry.amount)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatOrderDate(order.orderDate || order.harvestDate || order.date)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge status={status} />
                          {reason ? (
                            <span className="max-w-[10rem] truncate text-[10px] text-[#DC2626]" title={reason}>
                              {reason}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="sticky right-0 z-10 whitespace-nowrap border-l border-[#D4D4D4] bg-white px-3 py-2">
                        <div className="flex flex-nowrap items-center justify-end gap-1">
                          <Link to={sheetActionPath(order)} className={ACTION_BTN}>
                            {sheetActionLabel(order)}
                          </Link>
                          {order.farmerId ? (
                            <Link to={`/farmer/manager/orders/farmer/${order.farmerId}`} className={ACTION_BTN}>
                              Farmer
                            </Link>
                          ) : null}
                        </div>
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
  );
}
