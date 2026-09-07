import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { acceptMyOrder, getMyOrder, rejectMyOrder } from "../api/farmerApi";
import PickupTimeline, { pickupStatusLabel } from "../components/pickup/PickupTimeline";
import { usePolling } from "../hooks/usePolling";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import RejectOrderModal from "../components/orders/RejectOrderModal";
import OrderQrCode from "../components/orders/OrderQrCode";
import { canAccept, canPrepare, canReject, formatMoney, formatOrderDate, rejectionText } from "../utils/orderDisplay";
import { formatProductBusinessId } from "../utils/cropLinks";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY } from "../utils/excelStyles";

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

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

function gradeRows(order) {
  const unit = order.unit || "Kg";
  const map = {};
  (Array.isArray(order.grades) ? order.grades : []).forEach((g) => {
    const label = String(g.label || g.name || "").trim();
    if (!label) return;
    if (!map[label]) map[label] = { qty: 0, rate: 0 };
    map[label].qty += Number(g.quantity || 0);
    const rate = Number(g.price ?? g.rate ?? g.pricePerKg ?? 0) || 0;
    if (rate > 0) map[label].rate = rate;
  });
  if (!Object.keys(map).length) {
    const label = String(order.grade || "Grade A").trim() || "Grade A";
    map[label] = {
      qty: Number(order.orderedQuantity || order.totalQuantity || 0),
      rate: Number(order.price || 0) || 0,
    };
  }
  const extras = Object.keys(map).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
  const ordered = [...DEFAULT_GRADES, ...extras]
    .filter((label) => Number(map[label]?.qty || 0) > 0)
    .map((label) => ({
      label,
      qty: map[label].qty,
      rate: map[label].rate,
      amount: Number(map[label].qty || 0) * Number(map[label].rate || 0),
      unit,
    }));
  return ordered.length
    ? ordered
    : [{ label: "Total", qty: Number(order.orderedQuantity || 0), rate: 0, amount: 0, unit }];
}

function Fact({ label, value }) {
  return (
    <div className="rounded-lg bg-[#F8FAF8] px-3 py-2">
      <p className="text-[10px] font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      {title ? (
        <p className="border-b border-[#F3F4F6] px-3 py-2 text-[12px] font-bold text-[#1F2937]">{title}</p>
      ) : null}
      <div className="px-3 py-2.5">{children}</div>
    </section>
  );
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

  const grades = useMemo(() => (order ? gradeRows(order) : []), [order]);

  if (loading) return <LoadingState rows={6} />;
  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may not belong to your farm."
        action={
          <Link to="/farmer/orders/new" className={EXCEL_BTN_PRIMARY}>
            Back to Orders
          </Link>
        }
      />
    );
  }

  const stock = order.productStock;
  const sellable = Number(order.availableStock ?? stock?.sellableQuantity ?? 0);
  const unit = order.unit || "Kg";
  const orderId = order.orderId || order.id;
  const pickup = order.pickup;
  const productName = order.productName || order.name || "Harvest Order";
  const productId = formatProductBusinessId({
    productId: order.productId,
    name: productName,
    productName,
    variety: order.variety,
    category: order.category,
  });
  const totalQty =
    Number(order.orderedQuantity || order.totalQuantity || 0) ||
    grades.reduce((s, g) => s + Number(g.qty || 0), 0);
  const orderValue = Number(order.orderValue || order.totalAmount || order.amount || 0);
  const reason = rejectionText(order);
  const showAccept = canAccept(order.status);
  const showReject = canReject(order.status);
  const showPrepare = canPrepare(order.status);
  const lowStock = showAccept && sellable < totalQty;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to="/farmer/orders/new" className="text-[11px] font-semibold text-[#217346] hover:underline">
            ← Orders
          </Link>
          <h1 className="mt-0.5 text-lg font-bold text-[#1F2937]">{productName}</h1>
          <p className="mt-0.5 font-mono text-[11px] text-[#6B7280]">{orderId}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {reason ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-[#DC2626]">
          Rejected: {reason}
        </div>
      ) : null}

      {lowStock ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
          Stock is low. Available {sellable.toLocaleString("en-IN")} {unit}, order needs{" "}
          {totalQty.toLocaleString("en-IN")} {unit}.
        </div>
      ) : null}

      <Card title="Product">
        <p className="text-[15px] font-bold text-[#1F2937]">{productName}</p>
        {order.variety ? <p className="mt-0.5 text-[12px] text-[#6B7280]">Variety: {order.variety}</p> : null}
        <p className="mt-0.5 break-all font-mono text-[11px] text-emerald-700">{productId}</p>
        {order.category ? <p className="mt-1 text-[11px] text-[#6B7280]">{order.category}</p> : null}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Fact label="Order date" value={dateDMY(order.orderDate || order.harvestDate || order.date || order.createdAt)} />
        <Fact label="Pickup date" value={dateDMY(order.pickupDate || order.requiredDate)} />
        <Fact label="Pickup time" value={time12h(order.pickupTime || order.harvestTime)} />
        <Fact label="Total qty" value={`${totalQty.toLocaleString("en-IN")} ${unit}`} />
      </div>

      <Card title="Grades">
        <div className="-mx-3 -my-2.5 overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#F8FAF8] text-[10px] font-bold text-[#6B7280]">
                <th className="px-3 py-1.5 text-left">Grade</th>
                <th className="px-3 py-1.5 text-right">Qty</th>
                <th className="px-3 py-1.5 text-right">Rate</th>
                <th className="px-3 py-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.label} className="border-t border-[#F3F4F6]">
                  <td className="px-3 py-2 font-semibold text-[#1F2937]">{g.label}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-[#217346]">
                    {Number(g.qty).toLocaleString("en-IN")} {g.unit}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#6B7280]">
                    {Number(g.rate) > 0 ? `${formatMoney(g.rate)}/${g.unit}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-[#1F2937]">
                    {Number(g.amount) > 0 ? formatMoney(g.amount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#E5E7EB] bg-[#F8FAF8]">
                <td className="px-3 py-2 font-semibold text-[#6B7280]" colSpan={3}>
                  Order value
                </td>
                <td className="px-3 py-2 text-right text-[14px] font-bold tabular-nums text-[#1F2937]">
                  {formatMoney(orderValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {pickup ? (
        <Card title="Pickup">
          <div className="grid grid-cols-2 gap-2">
            <Fact label="Driver" value={pickup.driverName || "Not assigned"} />
            <Fact label="Mobile" value={pickup.driverMobile || "—"} />
            <Fact label="Vehicle" value={pickup.vehicleNumber || "—"} />
            <Fact label="Status" value={pickupStatusLabel(pickup.liveStatus || pickup.status)} />
          </div>
          <div className="mt-3">
            <PickupTimeline status={pickup.status || order.status} />
          </div>
          {(pickup.confirmationPhotos || []).length ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {pickup.confirmationPhotos.map((src, i) => (
                <img key={i} src={src} alt={`Pickup photo ${i + 1}`} className="h-16 w-full rounded object-cover" />
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      {pickup?.qrPayload || order.qrPayload ? (
        <Card title="Show this QR at pickup">
          <OrderQrCode value={pickup?.qrPayload || order.qrPayload} />
        </Card>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Link to="/farmer/orders/new" className={`${EXCEL_BTN} !min-h-10 w-full sm:w-auto`}>
          Back
        </Link>
        {showReject ? (
          <button type="button" className={`${EXCEL_BTN_DANGER} !min-h-10 w-full sm:w-auto`} onClick={() => setRejectOpen(true)}>
            Reject
          </button>
        ) : null}
        {showPrepare ? (
          <Link to={`/farmer/orders/${id}/prepare`} className={`${EXCEL_BTN_PRIMARY} !min-h-10 w-full sm:w-auto`}>
            Prepare
          </Link>
        ) : null}
        {showAccept ? (
          <button type="button" className={`${EXCEL_BTN_PRIMARY} !min-h-10 w-full sm:w-auto`} onClick={() => setAcceptOpen(true)}>
            Accept
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={acceptOpen}
        title="Accept this order?"
        message={`Confirm ${productName} — ${totalQty.toLocaleString("en-IN")} ${unit}.`}
        confirmLabel="Accept order"
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
