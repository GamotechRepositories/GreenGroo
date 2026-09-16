import { Fragment, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { acceptMyOrder, getMyOrders, rejectMyOrder } from "../api/farmerApi";
import { usePolling } from "../hooks/usePolling";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import RejectOrderModal from "../components/orders/RejectOrderModal";
import { canAccept, canReject, formatMoney, formatOrderDate, orderTitle } from "../utils/orderDisplay";
import { EXCEL_PAGE_TITLE } from "../utils/excelStyles";
import StatusBadge from "../components/ui/StatusBadge";
import CopyId from "../components/ui/CopyId";
import { Search, UserCheck, Users } from "lucide-react";

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

const TH = "border border-[#C5D4C8] bg-[#E8F0EA] px-1 py-1.5 text-center text-[9px] font-bold leading-tight text-[#374151] sm:px-1.5 sm:text-[10px]";
const TD = "border border-[#E5E7EB] px-1 py-1.5 text-[10px] leading-tight text-[#1F2937] sm:px-1.5 sm:text-[11px]";
const TD_NUM = `${TD} text-right tabular-nums`;

/** Soft color grading per grade column group */
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
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Convert "17:23" / "17:23:00" / "5:30 PM" → 12-hour with AM/PM */
function formatTime12h(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/am|pm/i.test(raw)) {
    return raw.replace(/\s+/g, " ").toUpperCase().replace(/AM/i, "AM").replace(/PM/i, "PM");
  }
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw;
  let hour = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${min} ${period}`;
}

function shortOrderId(id = "") {
  const s = String(id);
  const m = s.match(/(\d{5})$/);
  return { full: s, short: m ? `…${m[1]}` : s };
}

function gradeDetailMap(order) {
  const map = {};
  const unit = order.unit || "Kg";
  (Array.isArray(order.grades) ? order.grades : []).forEach((g) => {
    const label = String(g.label || g.name || "").trim();
    if (!label) return;
    const qty = Number(g.quantity || 0);
    const rate = Number(g.price ?? g.rate ?? g.pricePerKg ?? 0) || 0;
    const amount = Number(g.amount ?? g.total ?? qty * rate) || 0;
    if (!map[label]) map[label] = { qty: 0, rate: 0, amount: 0, unit };
    map[label].qty += qty;
    if (rate > 0) map[label].rate = rate;
    if (amount > 0) map[label].amount = amount;
  });
  if (!Object.keys(map).length) {
    const qty = Number(order.orderedQuantity || order.totalQuantity || 0);
    const rate = Number(order.price || 0);
    const label = order.grade || "Grade A";
    map[label] = { qty, rate, amount: qty * rate, unit };
  }
  return map;
}

function formatQty(qty, unit = "Kg") {
  const n = Number(qty || 0);
  if (!(n > 0)) return <span className="text-[#9CA3AF]">0</span>;
  return (
    <span>
      {n.toLocaleString("en-IN")}{" "}
      <span className="text-[9px] font-normal text-[#6B7280]">{unit}</span>
    </span>
  );
}

function formatRate(rate, qty = 0) {
  if (!(Number(qty || 0) > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  const n = Number(rate || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return formatMoney(n);
}

function isOrderDeleted(o) {
  if (!o) return true;
  if (o.isDeleted === true || o.deleted === true) return true;
  const s = String(o.status || "").trim().toUpperCase();
  return s === "DELETED" || s === "CANCELLED" || s === "CANCELED" || s === "DELETED_ORDER";
}

function OrdersPage({ filter = "new" }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerFilter, setFarmerFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [acceptId, setAcceptId] = useState("");
  const [rejectOrder, setRejectOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyOrders({ filter });
      setOrders(Array.isArray(data) ? data.filter((o) => !isOrderDeleted(o)) : []);
    } catch (err) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  usePolling(() => {
    getMyOrders({ filter })
      .then((data) => setOrders(Array.isArray(data) ? data.filter((o) => !isOrderDeleted(o)) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter], 5000);

  // Group unique farmers for filter dropdown & chips
  const farmerStats = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const key = o.farmerId || o.farmerCode || o.farmerName;
      if (key) {
        if (!map.has(key)) {
          map.set(key, {
            key,
            id: o.farmerId || o.farmerCode || "",
            code: o.farmerCode || o.farmerId || "",
            name: o.farmerName || "Farmer",
            mobile: o.farmerMobile || "",
            location: o.farmerLocation || o.farmerVillage || "",
            count: 0,
          });
        }
        map.get(key).count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  // Filtered orders list by Farmer & Search
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const fKey = o.farmerId || o.farmerCode || o.farmerName;
      if (farmerFilter !== "ALL" && fKey !== farmerFilter && o.farmerId !== farmerFilter && o.farmerCode !== farmerFilter && o.farmerName !== farmerFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${o.orderId || o.id} ${o.productName} ${o.variety} ${o.farmerName} ${o.farmerCode} ${o.farmerMobile} ${o.farmerLocation}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, farmerFilter, searchQuery]);

  const gradeColumns = useMemo(() => {
    const set = new Set(DEFAULT_GRADES);
    orders.forEach((o) => {
      Object.keys(gradeDetailMap(o)).forEach((label) => set.add(label));
    });
    const extras = Array.from(set).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
    return [...DEFAULT_GRADES, ...extras];
  }, [orders]);

  const acceptTarget = orders.find((o) => (o.orderId || o.id) === acceptId);

  return (
    <div className="space-y-4">
      {/* 1. Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>{orderTitle(filter)}</h1>
          <p className="text-xs text-[#6B7280]">
            Farmer-wise view • {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"} across {farmerStats.length} assigned farmer{farmerStats.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            {farmerStats.length} Active Farmers
          </span>
        </div>
      </div>

      {/* 2. Filter Toolbar (Farmer dropdown & Search input) */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Farmer Dropdown Selector */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <label className="text-xs font-bold text-[#374151] whitespace-nowrap flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              Farmer:
            </label>
            <select
              value={farmerFilter}
              onChange={(e) => setFarmerFilter(e.target.value)}
              className="w-full sm:w-auto min-w-[200px] max-w-sm rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2937] shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ALL">All Farmers ({orders.length} Orders)</option>
              {farmerStats.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.name} {f.code ? `(${f.code})` : ""} — {f.count} order{f.count === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search farmer, ID, crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-[#1F2937] placeholder-slate-400 shadow-xs focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Quick Farmer Chips */}
        {farmerStats.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap mr-1">Quick Select:</span>
            <button
              type="button"
              onClick={() => setFarmerFilter("ALL")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition cursor-pointer shrink-0 ${
                farmerFilter === "ALL"
                  ? "bg-emerald-700 text-white shadow-xs font-semibold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All ({orders.length})
            </button>
            {farmerStats.map((f) => {
              const isSel = farmerFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFarmerFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] transition cursor-pointer shrink-0 ${
                    isSel
                      ? "bg-emerald-700 text-white shadow-xs font-semibold"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{f.name}</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${isSel ? "bg-emerald-900/60 text-white" : "bg-slate-200 text-slate-800"}`}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title={`No ${orderTitle(filter).toLowerCase()} found`}
          description={
            farmerFilter !== "ALL" || searchQuery
              ? "No orders match the selected farmer or search criteria."
              : "Orders in this status will appear here."
          }
        />
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="space-y-2.5 md:hidden">
            {filteredOrders.map((order) => (
              <OrderMobileCard
                key={order.orderId || order.id}
                order={order}
                gradeColumns={gradeColumns}
                onAccept={() => setAcceptId(order.orderId || order.id)}
                onReject={() => setRejectOrder(order)}
              />
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm md:block">
            <table className="w-full table-fixed border-collapse text-[10px] sm:text-[11px]">
              <colgroup>
                <col className="w-[3%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[6%]" />
                {gradeColumns.map((g) => (
                  <Fragment key={`col-${g}`}>
                    <col className="w-[5%]" />
                    <col className="w-[5%]" />
                  </Fragment>
                ))}
                <col className="w-[13%]" />
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
                    Farmer
                  </th>
                  <th className={TH} rowSpan={2}>
                    Product
                  </th>
                  <th className={TH} rowSpan={2}>
                    Variety
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
                  const id = order.orderId || order.id;
                  const oid = shortOrderId(id);
                  const map = gradeDetailMap(order);
                  const unit = order.unit || "Kg";
                  return (
                    <tr
                      key={id}
                      onClick={() => navigate(`/manager/orders/${id}`)}
                      className="hover:bg-[#F2F8F3] transition-colors cursor-pointer group"
                      title="Click row to view full order & farmer details"
                    >
                      <td className={`${TD} text-center text-[#9CA3AF]`}>{idx + 1}</td>
                      <td className={`${TD} sm:text-[10px]`}>
                        <CopyId value={oid.full} textClassName="font-mono text-[9px] font-semibold text-[#217346] sm:text-[10px]" />
                      </td>
                      {/* Farmer Column (Compact) */}
                      <td className={`${TD} min-w-0`} title={[order.farmerName, order.farmerCode, order.farmerLocation].filter(Boolean).join(" · ")}>
                        <p className="truncate font-bold text-[#1F2937] text-[10px] sm:text-[11px] leading-tight group-hover:text-emerald-800">{order.farmerName || "—"}</p>
                        {order.farmerCode ? (
                          <span className="inline-block mt-0.5 rounded bg-emerald-50 px-1 py-0.2 font-mono text-[9px] font-semibold text-emerald-800 border border-emerald-200 truncate max-w-full">
                            {order.farmerCode}
                          </span>
                        ) : null}
                      </td>
                      {/* Product Column */}
                      <td className={`${TD} truncate`} title={order.productName}>
                        <p className="font-bold text-[#1F2937] truncate">{order.productName || "Product"}</p>
                      </td>
                      {/* Variety Column (Separate) */}
                      <td className={`${TD} truncate`} title={order.variety}>
                        {order.variety ? (
                          <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 border border-slate-200 truncate max-w-full">
                            {order.variety}
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF] text-[10px]">—</span>
                        )}
                      </td>
                      <td className={`${TD} text-center`}>
                        {shortDate(order.orderDate || order.date || order.createdAt || order.requiredDate)}
                      </td>
                      <td className={`${TD} text-center font-medium`}>{shortDate(order.pickupDate)}</td>
                      <td className={`${TD} text-center`}>{formatTime12h(order.pickupTime)}</td>
                      {gradeColumns.map((g) => {
                        const row = map[g] || { qty: 0, rate: 0, amount: 0, unit };
                        const tone = gradeTone(g);
                        const cell = `border px-0.5 py-1.5 text-center text-[10px] tabular-nums sm:text-[11px] ${tone.cell}`;
                        return (
                          <Fragment key={`${id}-${g}`}>
                            <td className={cell}>{formatQty(row.qty, row.unit || unit)}</td>
                            <td className={cell}>{formatRate(row.rate, row.qty)}</td>
                          </Fragment>
                        );
                      })}
                      <td className={`${TD} bg-white px-1 py-1 align-middle`}>
                        <OrderActions
                          order={order}
                          onAccept={() => setAcceptId(id)}
                          onReject={() => setRejectOrder(order)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(acceptId)}
        title="Accept order?"
        message={`Confirm acceptance of this ${acceptTarget?.productName || "product"} order for farmer ${acceptTarget?.farmerName || ""}?`}
        confirmLabel="Confirm Accept"
        loading={busy}
        onClose={() => setAcceptId("")}
        onConfirm={async () => {
          setBusy(true);
          try {
            await acceptMyOrder(acceptId);
            toast.success(
              `तुम्ही ${acceptTarget?.farmerName ? `${acceptTarget.farmerName} चा ` : ""}${acceptTarget?.orderedQuantity || ""} ${acceptTarget?.unit || "Kg"} ${acceptTarget?.productName || "product"} चा order स्वीकारला आहात`
            );
            setAcceptId("");
            await load();
          } catch (err) {
            toast.error(err.message || "Insufficient available stock.");
          } finally {
            setBusy(false);
          }
        }}
      />

      <RejectOrderModal
        open={Boolean(rejectOrder)}
        loading={busy}
        onClose={() => setRejectOrder(null)}
        onConfirm={async (payload) => {
          setBusy(true);
          try {
            await rejectMyOrder(rejectOrder.orderId || rejectOrder.id, payload);
            toast.success("Order rejected");
            setRejectOrder(null);
            await load();
          } catch (err) {
            toast.error(err.message || "Failed to reject order");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function OrderMobileCard({ order, gradeColumns, onAccept, onReject }) {
  const navigate = useNavigate();
  const id = order.orderId || order.id;
  const oid = shortOrderId(id);
  const map = gradeDetailMap(order);
  const unit = order.unit || "Kg";

  return (
    <article
      onClick={() => navigate(`/manager/orders/${id}`)}
      className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm space-y-2.5 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.99]"
      title="Click to view full order & farmer details"
    >
      {/* Top Banner: Farmer Name & Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800 shrink-0">
              🌱
            </span>
            <p className="truncate text-xs font-bold text-[#1F2937]">
              {order.farmerName || "Farmer"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#6B7280]">
            {order.farmerCode ? <span className="font-mono font-semibold text-emerald-700">{order.farmerCode}</span> : null}
            {order.farmerLocation ? <span>· 📍 {order.farmerLocation}</span> : null}
          </div>
        </div>
        <StatusBadge status={order.status} className="shrink-0" />
      </div>

      {/* Product & Order ID Row */}
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="min-w-0 truncate text-[13px] font-bold text-[#1F2937]">
            {order.productName || "Product"}
            {order.variety ? <span className="font-semibold text-[#6B7280]"> · {order.variety}</span> : null}
          </p>
        </div>
        <CopyId
          value={oid.full}
          className="shrink-0"
          textClassName="font-mono text-[10px] text-emerald-700"
        />
      </div>

      {/* Dates Row */}
      <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] text-[#6B7280] bg-slate-50/80 px-2 py-1.5 rounded-lg">
        <span>
          Order <span className="font-semibold text-[#1F2937]">{shortDate(order.orderDate || order.date || order.createdAt || order.requiredDate)}</span>
        </span>
        <span>
          Pickup <span className="font-semibold text-[#1F2937]">{shortDate(order.pickupDate)}</span>
        </span>
        <span>
          Time <span className="font-semibold text-[#1F2937]">{formatTime12h(order.pickupTime)}</span>
        </span>
      </div>

      {/* Grades Table */}
      <div className="overflow-hidden rounded-md border border-[#E5E7EB]">
        <div className="grid grid-cols-[1fr_1fr_1fr] bg-[#F8FAF8] px-2 py-1 text-[10px] font-bold text-[#6B7280]">
          <span>Grade</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Rate</span>
        </div>
        {gradeColumns.map((g) => {
          const row = map[g] || { qty: 0, rate: 0, unit };
          const tone = gradeTone(g);
          return (
            <div key={g} className={`grid grid-cols-[1fr_1fr_1fr] items-center border-t border-[#E5E7EB] px-2 py-1.5 text-[12px] ${tone.cell}`}>
              <span className="font-semibold text-[#1F2937]">{g}</span>
              <span className="text-right font-semibold tabular-nums">{formatQty(row.qty, row.unit || unit)}</span>
              <span className="text-right font-semibold tabular-nums">{formatRate(row.rate, row.qty)}</span>
            </div>
          );
        })}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <OrderActions order={order} onAccept={onAccept} onReject={onReject} large />
      </div>
    </article>
  );
}

function OrderActions({ order, onAccept, onReject, large = false }) {
  const id = order.orderId || order.id;
  const base = large
    ? "inline-flex h-9 min-w-[4.5rem] flex-1 items-center justify-center rounded-lg px-2 text-[12px] font-semibold leading-none whitespace-nowrap cursor-pointer"
    : "inline-flex h-6 min-w-[3.25rem] flex-1 items-center justify-center rounded px-1.5 text-[9px] font-semibold leading-none whitespace-nowrap cursor-pointer";
  const primary = `${base} border border-[#217346] bg-[#217346] text-white hover:bg-[#1a5c38] shadow-xs`;
  const danger = `${base} border border-[#FECACA] bg-white text-[#DC2626] hover:bg-[#FEF2F2]`;
  const prep = `${base} border border-[#D4D4D4] bg-white text-[#1F2937] hover:bg-[#F3F4F6]`;

  const showAccept = canAccept(order.status);
  const showReject = canReject(order.status);
  const showPrep = order.status === "PREPARING" || order.status === "ACCEPTED" || order.status === "PACKING";

  if (!showAccept && !showReject && !showPrep) {
    return <span className="text-[10px] text-[#9CA3AF] text-center block">—</span>;
  }

  return (
    <div className="flex w-full items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
      {showAccept ? (
        <button
          type="button"
          className={primary}
          onClick={(e) => {
            e.stopPropagation();
            onAccept();
          }}
        >
          Accept
        </button>
      ) : null}
      {showReject ? (
        <button
          type="button"
          className={danger}
          onClick={(e) => {
            e.stopPropagation();
            onReject();
          }}
        >
          Reject
        </button>
      ) : null}
      {showPrep ? (
        <Link
          to={`/manager/orders/${id}/prepare`}
          className={prep}
          onClick={(e) => e.stopPropagation()}
        >
          Prep
        </Link>
      ) : null}
    </div>
  );
}

export default OrdersPage;
