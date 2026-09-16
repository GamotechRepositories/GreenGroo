import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { acceptMyOrder, getMyOrder, rejectMyOrder } from "../api/farmerApi";
import PickupTimeline, { DriverInfo, PICKUP_STATUS_LABELS, pickupFlowStatus } from "../components/pickup/PickupTimeline";
import { usePolling } from "../hooks/usePolling";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import RejectOrderModal from "../components/orders/RejectOrderModal";
import OrderQrCode from "../components/orders/OrderQrCode";
import { stableOrderQrValue } from "../utils/orderQr";
import { canAccept, canPrepare, canReject, formatMoney, formatOrderDate, rejectionText } from "../utils/orderDisplay";
import { formatProductBusinessId } from "../utils/cropLinks";
import CopyId from "../components/ui/CopyId";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY } from "../utils/excelStyles";
import { User, Phone, Mail, MapPin, Building2, CreditCard, ArrowLeft } from "lucide-react";

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
    <div className="rounded-lg bg-[#F8FAF8] px-3 py-2 border border-slate-100">
      <p className="text-[10px] font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      {title ? (
        <p className="border-b border-[#F3F4F6] px-3.5 py-2.5 text-[12px] font-bold text-[#1F2937]">{title}</p>
      ) : null}
      <div className="px-3.5 py-3">{children}</div>
    </section>
  );
}

function FarmerInfoCard({ order }) {
  if (!order.farmerName && !order.farmerCode && !order.farmerId) return null;

  const farmerCode = order.farmerCode || order.farmerId || "";
  const locationParts = [
    order.farmerAddress,
    order.farmerVillage,
    order.farmerTaluka,
    order.farmerDistrict,
    order.farmerState,
    order.farmerPincode,
  ].filter(Boolean);

  const fullAddress = order.farmerAddress || locationParts.join(", ") || order.farmerLocation || "—";

  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50/70 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold text-xs shadow-xs">
            👨‍🌾
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Farmer Information</h3>
            <p className="text-[10px] text-emerald-700 font-medium">Assigned Producer & Farm Record</p>
          </div>
        </div>
        {farmerCode && (
          <CopyId
            value={farmerCode}
            textClassName="font-mono text-[11px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-xs"
          />
        )}
      </div>

      <div className="p-3.5 space-y-3">
        {/* Basic Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-200/70">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-emerald-600" /> Farmer Name
            </span>
            <p className="mt-1 text-xs font-bold text-slate-900">{order.farmerName || "—"}</p>
          </div>

          <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-200/70">
            <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-600" /> Contact / Mobile
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              {order.farmerMobile ? (
                <a
                  href={`tel:${order.farmerMobile}`}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  {order.farmerMobile}
                </a>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
          </div>

          {order.farmerEmail ? (
            <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-200/70">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-emerald-600" /> Email
              </span>
              <p className="mt-1 text-xs font-bold text-slate-900 truncate">
                <a href={`mailto:${order.farmerEmail}`} className="text-slate-800 hover:underline">
                  {order.farmerEmail}
                </a>
              </p>
            </div>
          ) : null}

          {order.farmerFarmName ? (
            <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-200/70">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" /> Farm Name
              </span>
              <p className="mt-1 text-xs font-bold text-slate-900">{order.farmerFarmName}</p>
            </div>
          ) : null}

          {(order.farmerFarmArea || order.farmerFarmType) ? (
            <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-200/70">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                🌱 Farm Area & Type
              </span>
              <p className="mt-1 text-xs font-bold text-slate-900">
                {[order.farmerFarmArea, order.farmerFarmType].filter(Boolean).join(" • ")}
              </p>
            </div>
          ) : null}
        </div>

        {/* Address Banner */}
        <div className="rounded-lg bg-emerald-50/40 border border-emerald-100 p-2.5 flex items-start gap-2.5">
          <MapPin className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-emerald-950 uppercase tracking-wide">Farm Address & Location</p>
            <p className="text-xs text-slate-800 font-medium mt-0.5 leading-relaxed">
              {fullAddress}
            </p>
            {(order.farmerVillage || order.farmerTaluka || order.farmerDistrict || order.farmerState || order.farmerPincode) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600">
                {order.farmerVillage && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">Village: {order.farmerVillage}</span>}
                {order.farmerTaluka && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">Taluka: {order.farmerTaluka}</span>}
                {order.farmerDistrict && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">District: {order.farmerDistrict}</span>}
                {order.farmerState && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">State: {order.farmerState}</span>}
                {order.farmerPincode && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono font-semibold text-emerald-800">PIN: {order.farmerPincode}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Bank details if present */}
        {order.farmerBank && (order.farmerBank.accountNumber || order.farmerBank.bankName) ? (
          <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 flex items-start gap-2.5">
            <CreditCard className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-700 uppercase">Farmer Bank Details</p>
              <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Bank Name:</span>
                  <span className="font-semibold text-slate-800">{order.farmerBank.bankName || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Account Holder:</span>
                  <span className="font-semibold text-slate-800">{order.farmerBank.accountHolder || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Account Number:</span>
                  <span className="font-mono font-semibold text-slate-800">{order.farmerBank.accountNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">IFSC Code:</span>
                  <span className="font-mono font-semibold text-slate-800">{order.farmerBank.ifsc || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
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
        description="This order may not belong to your managed farmers."
        action={
          <Link to="/manager/orders/new" className={EXCEL_BTN_PRIMARY}>
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
  const trackStatus = pickupFlowStatus(pickup, order.status);
  const showTracking = Boolean(PICKUP_STATUS_LABELS[trackStatus]) || Boolean(pickup);
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
    <div className="mx-auto max-w-4xl space-y-3.5 pb-8">
      <div className="flex items-center justify-between">
        <Link
          to="/manager/orders/new"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#217346] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
        </Link>
        <StatusBadge status={order.status} />
      </div>

      <div className="min-w-0">
        <h1 className="mt-0.5 text-lg font-bold text-[#1F2937]">{productName}</h1>
        <CopyId value={orderId} className="mt-0.5" textClassName="font-mono text-[11px] text-[#6B7280]" />
      </div>

      {/* Complete Farmer Info Card */}
      <FarmerInfoCard order={order} />

      {showTracking ? (
        <Card title="Status">
          <PickupTimeline status={trackStatus} />
          <DriverInfo pickup={pickup} />
        </Card>
      ) : null}

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
        <CopyId value={productId} className="mt-0.5" textClassName="font-mono text-[11px] text-emerald-700" breakAll />
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

      {stableOrderQrValue(order) ? (
        <Card title="Order QR">
          <OrderQrCode value={stableOrderQrValue(order)} record={order} />
        </Card>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Link to="/manager/orders/new" className={`${EXCEL_BTN} !min-h-10 w-full sm:w-auto`}>
          Back
        </Link>
        {showReject ? (
          <button type="button" className={`${EXCEL_BTN_DANGER} !min-h-10 w-full sm:w-auto`} onClick={() => setRejectOpen(true)}>
            Reject
          </button>
        ) : null}
        {showPrepare ? (
          <Link to={`/manager/orders/${id}/prepare`} className={`${EXCEL_BTN_PRIMARY} !min-h-10 w-full sm:w-auto`}>
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
            navigate(`/manager/orders/${id}/prepare`);
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
