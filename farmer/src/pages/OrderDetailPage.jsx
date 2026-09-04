import { Fragment, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { acceptMyOrder, getMyOrder, rejectMyOrder } from "../api/farmerApi";
import PickupTimeline from "../components/pickup/PickupTimeline";
import { usePolling } from "../hooks/usePolling";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import RejectOrderModal from "../components/orders/RejectOrderModal";
import OrderQrCode from "../components/orders/OrderQrCode";
import { canAccept, canPrepare, canReject, formatMoney, formatOrderDate, rejectionText } from "../utils/orderDisplay";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY, EXCEL_PAGE_TITLE } from "../utils/excelStyles";

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

const TH = "border border-[#C5D4C8] bg-[#E8F0EA] px-2 py-1.5 text-left text-[10px] font-bold text-[#374151]";
const TD = "border border-[#E5E7EB] px-2 py-1.5 text-[11px] text-[#1F2937]";
const TD_NUM = `${TD} text-right tabular-nums`;

const GRADE_COLORS = {
  "Grade A": { head: "border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]", cell: "border-[#A7F3D0] bg-[#ECFDF5]" },
  "Grade B": { head: "border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]", cell: "border-[#BFDBFE] bg-[#EFF6FF]" },
  "Grade C": { head: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]", cell: "border-[#FDE68A] bg-[#FFFBEB]" },
};

function gradeTone(label = "") {
  return GRADE_COLORS[label] || { head: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]", cell: "border-[#E5E7EB] bg-[#F9FAFB]" };
}

function dateDMY(value) {
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

function time12h(value) {
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
  const unit = order.unit || "Kg";
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
    const label = String(order.grade || "Grade A").trim() || "Grade A";
    map[label] = {
      qty: Number(order.orderedQuantity || 0),
      rate: Number(order.price || 0) || 0,
      unit,
    };
  }
  return map;
}

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  usePolling(() => {
    getMyOrder(id)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id], 5000);

  const gradeMap = useMemo(() => (order ? gradeDetailMap(order) : {}), [order]);
  const gradeColumns = useMemo(() => {
    const set = new Set(DEFAULT_GRADES);
    Object.keys(gradeMap).forEach((k) => set.add(k));
    const extras = Array.from(set).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
    return [...DEFAULT_GRADES, ...extras];
  }, [gradeMap]);

  if (loading) return <LoadingState rows={8} />;
  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may not belong to your farm."
        action={
          <Link to="/farmer/orders/new" className={EXCEL_BTN_PRIMARY}>
            Back to New Orders
          </Link>
        }
      />
    );
  }

  const stock = order.productStock;
  const sellable = order.availableStock ?? stock?.sellableQuantity ?? 0;
  const unit = order.unit || "Kg";
  const orderId = order.orderId || order.id;
  const pickup = order.pickup;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Link to="/farmer/orders/new" className="text-[11px] font-semibold text-[#217346] hover:underline">
            ← Orders
          </Link>
          <h1 className={`${EXCEL_PAGE_TITLE} mt-0.5 truncate font-mono text-base sm:text-lg`}>{orderId}</h1>
          <p className="truncate text-[12px] text-[#6B7280]">
            <span className="font-semibold text-[#1F2937]">{order.productName || "Product"}</span>
            {order.variety ? ` · ${order.variety}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={order.status} />
          {canAccept(order.status) ? (
            <button type="button" className={`${EXCEL_BTN_PRIMARY} !min-h-8 px-3 text-[11px]`} onClick={() => setAcceptOpen(true)}>
              Accept
            </button>
          ) : null}
          {canReject(order.status) ? (
            <button type="button" className={`${EXCEL_BTN_DANGER} !min-h-8 px-3 text-[11px]`} onClick={() => setRejectOpen(true)}>
              Reject
            </button>
          ) : null}
          {canPrepare(order.status) ? (
            <Link to={`/farmer/orders/${id}/prepare`} className={`${EXCEL_BTN_PRIMARY} !min-h-8 px-3 text-[11px]`}>
              Prepare
            </Link>
          ) : null}
          <Link to="/farmer/orders/new" className={`${EXCEL_BTN} !min-h-8 px-3 text-[11px]`}>
            Back
          </Link>
        </div>
      </div>

      {rejectionText(order) ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-[#DC2626]">
          Rejected: {rejectionText(order)}
        </div>
      ) : null}

      {/* Schedule + summary */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr>
              <th className={`${TH} w-[18%]`}>Order Date</th>
              <td className={TD}>{dateDMY(order.orderDate || order.date || order.createdAt || order.requiredDate)}</td>
              <th className={`${TH} w-[18%]`}>Pickup Date</th>
              <td className={TD}>{dateDMY(order.pickupDate)}</td>
              <th className={`${TH} w-[18%]`}>Pickup Time</th>
              <td className={TD}>{time12h(order.pickupTime)}</td>
            </tr>
            <tr>
              <th className={TH}>Centre</th>
              <td className={TD}>{order.collectionCentre || "—"}</td>
              <th className={TH}>Total Qty</th>
              <td className={`${TD} font-semibold`}>
                {Number(order.orderedQuantity || 0).toLocaleString("en-IN")} {unit}
              </td>
              <th className={TH}>Order Value</th>
              <td className={`${TD} font-semibold`}>{formatMoney(order.orderValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Grade-wise Qty / Rate */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <p className="border-b border-[#E5E7EB] bg-[#F8FAF8] px-3 py-1.5 text-[11px] font-bold text-[#374151]">Grade Details</p>
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr>
              {gradeColumns.map((g) => {
                const tone = gradeTone(g);
                return (
                  <th key={g} colSpan={2} className={`border px-2 py-1.5 text-center text-[10px] font-bold ${tone.head}`}>
                    {g}
                  </th>
                );
              })}
            </tr>
            <tr>
              {gradeColumns.map((g) => {
                const tone = gradeTone(g);
                const sub = `border px-2 py-1 text-center text-[10px] font-semibold ${tone.head}`;
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
            <tr>
              {gradeColumns.map((g) => {
                const row = gradeMap[g] || { qty: 0, rate: 0, unit };
                const tone = gradeTone(g);
                const cell = `border px-2 py-2 text-center text-[11px] tabular-nums ${tone.cell}`;
                const qty = Number(row.qty || 0);
                const rate = Number(row.rate || 0);
                return (
                  <Fragment key={`r-${g}`}>
                    <td className={cell}>
                      {qty > 0 ? (
                        <>
                          {qty.toLocaleString("en-IN")}{" "}
                          <span className="text-[9px] text-[#6B7280]">{row.unit || unit}</span>
                        </>
                      ) : (
                        <span className="font-semibold text-[#9CA3AF]">×</span>
                      )}
                    </td>
                    <td className={cell}>
                      {qty > 0 && rate > 0 ? formatMoney(rate) : <span className="font-semibold text-[#9CA3AF]">×</span>}
                    </td>
                  </Fragment>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Stock */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <p className="border-b border-[#E5E7EB] bg-[#F8FAF8] px-3 py-1.5 text-[11px] font-bold text-[#374151]">Available Stock</p>
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr>
              <th className={TH}>Physical</th>
              <td className={TD}>
                {stock?.availableQuantity ?? "—"} {unit}
              </td>
              <th className={TH}>Reserved</th>
              <td className={TD}>
                {stock?.reservedQuantity ?? order.reservedQuantity ?? 0} {unit}
              </td>
              <th className={TH}>Available to Sell</th>
              <td className={`${TD} font-semibold`}>
                {sellable} {unit}
              </td>
            </tr>
          </tbody>
        </table>
        {canAccept(order.status) && sellable < Number(order.orderedQuantity) ? (
          <p className="px-3 py-2 text-[11px] font-semibold text-[#DC2626]">Insufficient available stock for this order.</p>
        ) : null}
      </div>

      {/* Pickup / driver — only when pickup exists */}
      {pickup ? (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <p className="border-b border-[#E5E7EB] bg-[#F8FAF8] px-3 py-1.5 text-[11px] font-bold text-[#374151]">Pickup & Driver</p>
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <th className={TH}>Packed Qty</th>
                <td className={TD}>
                  {pickup.packedQuantity || order.packedQuantity || 0} {unit}
                </td>
                <th className={TH}>Packages</th>
                <td className={TD}>{pickup.packageCount || order.packingDetails?.packageCount || 0}</td>
                <th className={TH}>Location</th>
                <td className={TD}>{pickup.pickupLocation || "—"}</td>
              </tr>
              <tr>
                <th className={TH}>Driver</th>
                <td className={TD}>{pickup.driverName || "Not assigned"}</td>
                <th className={TH}>Mobile</th>
                <td className={TD}>{pickup.driverMobile || "—"}</td>
                <th className={TH}>Vehicle</th>
                <td className={TD}>{pickup.vehicleNumber || "—"}</td>
              </tr>
              <tr>
                <th className={TH}>Pickup Status</th>
                <td className={TD} colSpan={5}>
                  {String(pickup.liveStatus || pickup.status || "—").replace(/_/g, " ")}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="px-3 py-3">
            <PickupTimeline status={pickup.status || order.status} />
          </div>
          {(pickup.confirmationPhotos || []).length ? (
            <div className="grid grid-cols-4 gap-2 px-3 pb-3">
              {pickup.confirmationPhotos.map((src, i) => (
                <img key={i} src={src} alt={`Pickup photo ${i + 1}`} className="h-16 w-full rounded object-cover" />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {pickup?.qrPayload || order.qrPayload ? (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <p className="border-b border-[#E5E7EB] bg-[#F8FAF8] px-3 py-1.5 text-[11px] font-bold text-[#374151]">Farmer QR</p>
          <div className="p-3">
            <p className="mb-2 text-[11px] text-[#6B7280]">Show this QR to the driver at pickup.</p>
            <OrderQrCode value={pickup?.qrPayload || order.qrPayload} />
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={acceptOpen}
        title="Accept order?"
        message={`Confirm acceptance of this ${order.productName || "product"} order?`}
        confirmLabel="Confirm Accept"
        loading={busy}
        onClose={() => setAcceptOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            setOrder(await acceptMyOrder(id));
            toast.success("Order accepted. Stock reserved.");
            setAcceptOpen(false);
            navigate(`/farmer/orders/${id}/prepare`);
          } catch (err) {
            toast.error(err.message || "Insufficient available stock.");
          } finally {
            setBusy(false);
          }
        }}
      />

      <RejectOrderModal
        open={rejectOpen}
        loading={busy}
        onClose={() => setRejectOpen(false)}
        onConfirm={async (payload) => {
          setBusy(true);
          try {
            setOrder(await rejectMyOrder(id, payload));
            toast.success("Order rejected");
            setRejectOpen(false);
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

export default OrderDetailPage;
