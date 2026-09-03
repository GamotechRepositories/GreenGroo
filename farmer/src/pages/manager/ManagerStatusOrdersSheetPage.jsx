import { useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { getManagerAllHarvestOrders } from "../../api/farmerApi";
import { usePolling } from "../../hooks/usePolling";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  canonicalOrderStatus,
  formatMoney,
  formatOrderDate,
  matchesOrderDateRange,
  rejectionText,
  todayISODate,
  yesterdayISODate,
} from "../../utils/orderDisplay";
import {
  EXCEL_PANEL,
  EXCEL_INPUT,
  EXCEL_BTN,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_TABLE,
  EXCEL_WRAP,
  EXCEL_HEAD,
  EXCEL_CELL,
} from "../../utils/excelStyles";

const SHEET_META = {
  accepted: {
    title: "Accepted Orders Sheet",
    sub: "Orders accepted by farmers — preparing and onward",
    accent: "border-emerald-600",
    banner: "bg-emerald-50 border-emerald-200 text-emerald-800",
    empty: "No accepted orders yet.",
  },
  rejected: {
    title: "Rejected Orders Sheet",
    sub: "Orders rejected by farmers",
    accent: "border-red-500",
    banner: "bg-red-50 border-red-200 text-red-700",
    empty: "No rejected orders yet.",
  },
};

function orderEntry(order) {
  const first = Array.isArray(order.products) && order.products.length > 0 ? order.products[0] : {};
  const qtyFromGrades = (order.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  const qtyFromProducts = (order.products || []).reduce((s, p) => s + Number(p.quantity || 0), 0);
  return {
    productId: order.productId || first.productId || first.id || "",
    productName: order.productName || first.name || "Farm Produce",
    quantity: Number(order.totalQuantity || order.orderedQuantity || 0) || qtyFromGrades || qtyFromProducts,
    amount: Number(order.totalAmount || order.orderValue || order.amount || 0),
    unit: order.unit || first.unit || "Kg",
  };
}

function productSheetPath(order) {
  const entry = orderEntry(order);
  const key = entry.productId || String(entry.productName || "produce").toLowerCase();
  const params = new URLSearchParams({ name: entry.productName || "" });
  if (entry.productId) params.set("productId", entry.productId);
  if (order.farmerId) params.set("farmerId", order.farmerId);
  return `/farmer/manager/orders/product/${encodeURIComponent(key)}?${params.toString()}`;
}

export default function ManagerStatusOrdersSheetPage() {
  const { pathname } = useLocation();
  const bucket = pathname.includes("/orders/rejected")
    ? "rejected"
    : pathname.includes("/orders/accepted")
      ? "accepted"
      : "";
  const meta = SHEET_META[bucket];

  const [farmers, setFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getManagerAllHarvestOrders();
      setFarmers(Array.isArray(data?.farmers) ? data.farmers : []);
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch {
      setFarmers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  usePolling(() => {
    if (bucket) loadData(true);
  }, [bucket], 5000);

  const rows = useMemo(() => {
    const query = q.toLowerCase().trim();
    return orders
      .filter((o) => {
        const status = canonicalOrderStatus(o.status);
        if (bucket === "rejected") return status === "REJECTED" || status === "CANCELLED";
        if (bucket === "accepted") {
          return status !== "NEW" && status !== "REJECTED" && status !== "CANCELLED";
        }
        return false;
      })
      .filter((o) => matchesOrderDateRange(o, dateFrom, dateTo))
      .filter((o) => {
        if (!query) return true;
        const entry = orderEntry(o);
        const farmerName = o.farmerName || farmers.find((f) => f.id === o.farmerId)?.name || "";
        return (
          String(o.id || o.orderId || "")
            .toLowerCase()
            .includes(query) ||
          entry.productName.toLowerCase().includes(query) ||
          farmerName.toLowerCase().includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.orderDate || b.harvestDate || b.createdAt || 0) -
          new Date(a.orderDate || a.harvestDate || a.createdAt || 0)
      );
  }, [orders, bucket, q, farmers, dateFrom, dateTo]);

  if (!meta) {
    return <Navigate to="/farmer/manager/orders" replace />;
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link to="/farmer/manager/orders" className={`${EXCEL_BTN} mb-1 inline-flex text-[11px]`}>
            ← All Orders
          </Link>
          <h1 className={EXCEL_PAGE_TITLE}>{meta.title}</h1>
          <p className={EXCEL_PAGE_SUB}>{meta.sub}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link
            to="/farmer/manager/orders/accepted"
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
              bucket === "accepted"
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600"
                : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            Accepted Sheet
          </Link>
          <Link
            to="/farmer/manager/orders/rejected"
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
              bucket === "rejected"
                ? "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500"
                : "border-red-200 bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            Rejected Sheet
          </Link>
        </div>
      </div>

      <div className={`rounded-lg border px-3 py-2 text-[12px] font-semibold ${meta.banner}`}>
        {rows.length} order{rows.length === 1 ? "" : "s"} on this sheet
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap items-end gap-1.5">
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">From</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${EXCEL_INPUT} !w-auto !py-2 !text-xs sm:!py-1.5`}
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">To</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${EXCEL_INPUT} !w-auto !py-2 !text-xs sm:!py-1.5`}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const today = todayISODate();
              setDateFrom(today);
              setDateTo(today);
            }}
            className={`${EXCEL_BTN} !min-h-9 !px-2.5 !text-[11px]`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              const yesterday = yesterdayISODate();
              setDateFrom(yesterday);
              setDateTo(yesterday);
            }}
            className={`${EXCEL_BTN} !min-h-9 !px-2.5 !text-[11px]`}
          >
            Yesterday
          </button>
          {dateFrom || dateTo ? (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className={`${EXCEL_BTN} !min-h-9 !px-2.5 !text-[11px]`}
            >
              Clear date
            </button>
          ) : null}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search order, product, farmer…"
          className={`${EXCEL_INPUT} w-full !py-2 !text-xs sm:max-w-xs sm:!py-1.5`}
        />
      </div>

      {loading ? (
        <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>
          {dateFrom || dateTo || q ? "No orders for this date / search." : meta.empty}
        </div>
      ) : (
        <div className={`${EXCEL_PANEL} overflow-hidden border-l-4 ${meta.accent}`}>
          <div className="divide-y divide-[#E5E7EB] sm:hidden">
            {rows.map((order) => {
              const entry = orderEntry(order);
              const id = order.id || order.orderId;
              const status = canonicalOrderStatus(order.status);
              const farmerName =
                order.farmerName || farmers.find((f) => f.id === order.farmerId)?.name || "—";
              const reason = rejectionText(order);
              return (
                <div key={id} className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-bold text-[#217346]">{id}</p>
                      <p className="mt-0.5 truncate text-[13px] font-semibold">{entry.productName}</p>
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
                  {bucket === "rejected" && reason ? (
                    <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{reason}</p>
                  ) : null}
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <Link to={productSheetPath(order)} className={`${EXCEL_BTN} w-full justify-center text-[11px]`}>
                      Product Sheet
                    </Link>
                    {order.farmerId ? (
                      <Link
                        to={`/farmer/manager/orders/farmer/${order.farmerId}`}
                        className={`${EXCEL_BTN} w-full justify-center text-[11px]`}
                      >
                        Farmer Sheet
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`${EXCEL_WRAP} hidden sm:block`}>
            <table className={EXCEL_TABLE}>
              <thead>
                <tr>
                  {(bucket === "rejected"
                    ? ["Order ID", "Date", "Product", "Farmer", "Qty", "Value", "Status", "Reason", "Action"]
                    : ["Order ID", "Date", "Product", "Farmer", "Qty", "Value", "Status", "Action"]
                  ).map((h) => (
                    <th key={h} className={EXCEL_HEAD}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => {
                  const entry = orderEntry(order);
                  const id = order.id || order.orderId;
                  const status = canonicalOrderStatus(order.status);
                  const farmerName =
                    order.farmerName || farmers.find((f) => f.id === order.farmerId)?.name || "—";
                  const reason = rejectionText(order);
                  return (
                    <tr key={id} className="hover:bg-[#F9F9F9]">
                      <td className={`${EXCEL_CELL} font-mono font-semibold text-[#217346]`}>{id}</td>
                      <td className={`${EXCEL_CELL} whitespace-nowrap`}>
                        {formatOrderDate(order.orderDate || order.harvestDate || order.date)}
                      </td>
                      <td className={EXCEL_CELL}>
                        <p className="font-semibold">{entry.productName}</p>
                        {entry.productId ? (
                          <p className="font-mono text-[10px] text-emerald-700">{entry.productId}</p>
                        ) : null}
                      </td>
                      <td className={EXCEL_CELL}>{farmerName}</td>
                      <td className={`${EXCEL_CELL} font-semibold`}>
                        {entry.quantity.toLocaleString("en-IN")} {entry.unit}
                      </td>
                      <td className={`${EXCEL_CELL} font-semibold text-[#217346]`}>{formatMoney(entry.amount)}</td>
                      <td className={EXCEL_CELL}>
                        <StatusBadge status={status} />
                      </td>
                      {bucket === "rejected" ? (
                        <td className={`${EXCEL_CELL} max-w-[12rem] text-[#DC2626]`}>
                          <span className="line-clamp-2 text-[11px]" title={reason}>
                            {reason || "—"}
                          </span>
                        </td>
                      ) : null}
                      <td className={`${EXCEL_CELL} whitespace-nowrap`}>
                        <div className="inline-flex gap-1">
                          <Link to={productSheetPath(order)} className={`${EXCEL_BTN} !px-2 !py-0.5 text-[10px]`}>
                            Product
                          </Link>
                          {order.farmerId ? (
                            <Link
                              to={`/farmer/manager/orders/farmer/${order.farmerId}`}
                              className={`${EXCEL_BTN} !px-2 !py-0.5 text-[10px]`}
                            >
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
