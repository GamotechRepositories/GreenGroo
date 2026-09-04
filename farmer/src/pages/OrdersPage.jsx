import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { acceptMyOrder, getMyOrders, rejectMyOrder } from "../api/farmerApi";
import { usePolling } from "../hooks/usePolling";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import RejectOrderModal from "../components/orders/RejectOrderModal";
import { canAccept, canReject, formatMoney, formatOrderDate, orderTitle } from "../utils/orderDisplay";
import { EXCEL_PAGE_TITLE } from "../utils/excelStyles";

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
  // Already ISO-like yyyy-mm-dd
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
  // GGC-ORD-20260903-00002 → …00002 on very small, else full
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
    map[label].amount += amount;
    if (rate > 0) map[label].rate = rate;
  });

  if (!Object.keys(map).length) {
    const label = String(order.grade || "Grade A").trim() || "Grade A";
    const qty = Number(order.orderedQuantity || 0);
    const rate = Number(order.price || 0) || 0;
    map[label] = {
      qty,
      rate,
      amount: Number(order.orderValue || qty * rate) || 0,
      unit,
    };
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
  return formatMoney(n);
}

function OrdersPage({ filter = "new" }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptId, setAcceptId] = useState("");
  const [rejectOrder, setRejectOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await getMyOrders({ filter }));
    } catch (err) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  usePolling(() => {
    getMyOrders({ filter })
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter], 5000);

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
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>{orderTitle(filter)}</h1>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : orders.length === 0 ? (
        <EmptyState title={`No ${orderTitle(filter).toLowerCase()}`} description="Orders in this status will appear here." />
      ) : (
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full table-fixed border-collapse text-[10px] sm:text-[11px]">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[6%]" />
              {gradeColumns.map((g) => (
                <Fragment key={`col-${g}`}>
                  <col className="w-[6%]" />
                  <col className="w-[5%]" />
                </Fragment>
              ))}
              <col className="w-[16%]" />
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
              {orders.map((order, idx) => {
                const id = order.orderId || order.id;
                const oid = shortOrderId(id);
                const map = gradeDetailMap(order);
                const unit = order.unit || "Kg";
                return (
                  <tr key={id} className="hover:bg-[#F9FBF9]">
                    <td className={`${TD} text-center text-[#9CA3AF]`}>{idx + 1}</td>
                    <td className={`${TD} font-mono text-[9px] font-semibold text-[#217346] sm:text-[10px]`} title={oid.full}>
                      <span className="hidden lg:inline">{oid.full}</span>
                      <span className="lg:hidden">{oid.short}</span>
                    </td>
                    <td className={`${TD} truncate`} title={[order.productName, order.variety].filter(Boolean).join(" · ")}>
                      <span className="font-semibold">{order.productName || "Product"}</span>
                      {order.variety ? <span className="block truncate text-[9px] text-[#6B7280]">{order.variety}</span> : null}
                    </td>
                    <td className={`${TD} text-center`}>
                      {shortDate(order.orderDate || order.date || order.createdAt || order.requiredDate)}
                    </td>
                    <td className={`${TD} text-center`}>{shortDate(order.pickupDate)}</td>
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
      )}

      <ConfirmDialog
        open={Boolean(acceptId)}
        title="Accept order?"
        message={`Confirm acceptance of this ${acceptTarget?.productName || "product"} order?`}
        confirmLabel="Confirm Accept"
        loading={busy}
        onClose={() => setAcceptId("")}
        onConfirm={async () => {
          setBusy(true);
          try {
            await acceptMyOrder(acceptId);
            toast.success(
              `तुम्ही ${acceptTarget?.orderedQuantity || ""} ${acceptTarget?.unit || "Kg"} ${acceptTarget?.productName || "product"} चा order स्वीकारला आहात`
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

function OrderActions({ order, onAccept, onReject }) {
  const id = order.orderId || order.id;
  const base =
    "inline-flex h-6 min-w-[3.25rem] flex-1 items-center justify-center rounded px-1 text-[9px] font-semibold leading-none whitespace-nowrap";
  const btn = `${base} border border-[#D4D4D4] bg-white text-[#1F2937] hover:bg-[#F3F4F6]`;
  const primary = `${base} border border-[#217346] bg-[#217346] text-white hover:bg-[#1a5c38]`;
  const danger = `${base} border border-[#FECACA] bg-white text-[#DC2626] hover:bg-[#FEF2F2]`;
  return (
    <div className="flex w-full items-center justify-center gap-1">
      <Link to={`/farmer/orders/${id}`} className={btn}>
        View
      </Link>
      {canAccept(order.status) ? (
        <button type="button" className={primary} onClick={onAccept}>
          Accept
        </button>
      ) : null}
      {canReject(order.status) ? (
        <button type="button" className={danger} onClick={onReject}>
          Reject
        </button>
      ) : null}
      {order.status === "PREPARING" || order.status === "ACCEPTED" || order.status === "PACKING" ? (
        <Link to={`/farmer/orders/${id}/prepare`} className={btn}>
          Prep
        </Link>
      ) : null}
      {["READY_FOR_PICKUP", "PICKUP_SCHEDULED", "DRIVER_ASSIGNED", "DISPATCHED", "DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED"].includes(
        order.status
      ) ? (
        <Link to={`/farmer/orders/${id}`} className={primary}>
          Pickup
        </Link>
      ) : null}
    </div>
  );
}

export default OrdersPage;
