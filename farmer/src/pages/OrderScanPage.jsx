import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getManagerAllHarvestOrders, getMyOrder } from "../api/farmerApi";
import { usePolling } from "../hooks/usePolling";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import CopyId from "../components/ui/CopyId";
import { selectIsManager } from "../store/farmerSlice";
import { formatMoney, formatOrderDate, rejectionText } from "../utils/orderDisplay";
import { formatProductBusinessId } from "../utils/cropLinks";
import PickupTimeline, { DriverInfo, PICKUP_STATUS_LABELS, pickupFlowStatus } from "../components/pickup/PickupTimeline";
import { parseOrderQrPayload } from "../utils/orderQr";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../utils/excelStyles";

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
  if (!Object.keys(map).length && Array.isArray(order.products)) {
    order.products.forEach((p) => {
      const label = String(p.grade || p.gradeName || "").trim();
      if (!label) return;
      if (!map[label]) map[label] = { qty: 0, rate: 0 };
      map[label].qty += Number(p.quantity || 0);
      const rate = Number(p.price || p.rate || 0) || 0;
      if (rate > 0) map[label].rate = rate;
    });
  }
  if (!Object.keys(map).length) {
    map["Total"] = {
      qty: Number(order.orderedQuantity || order.totalQuantity || 0),
      rate: 0,
    };
  }
  const extras = Object.keys(map).filter((g) => !DEFAULT_GRADES.includes(g) && g !== "Total").sort();
  const labels = map.Total && Object.keys(map).length === 1 ? ["Total"] : [...DEFAULT_GRADES, ...extras];
  return labels
    .filter((label) => map[label] != null)
    .map((label) => ({
      label,
      qty: map[label].qty,
      rate: map[label].rate,
      amount: Number(map[label].qty || 0) * Number(map[label].rate || 0),
      unit,
    }));
}

function Fact({ label, value }) {
  return (
    <div className="rounded-lg bg-[#F8FAF8] px-3 py-2">
      <p className="text-[10px] font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 break-words text-[13px] font-bold text-[#1F2937]">{value || "—"}</p>
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

function matchesScannedOrder(order, code) {
  const needle = String(code || "").trim().toUpperCase();
  if (!needle) return false;
  return [order.id, order.orderId, order.orderDisplayId].some((v) => String(v || "").trim().toUpperCase() === needle);
}

export default function OrderScanPage() {
  const { code } = useParams();
  const isManager = useSelector(selectIsManager);
  const orderCode = parseOrderQrPayload(decodeURIComponent(code || ""));
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  usePolling(() => {
    const load = async () => {
      if (!orderCode) {
        setOrder(null);
        setLoading(false);
        return;
      }
      if (!isManager) {
        try {
          const data = await getMyOrder(orderCode);
          setOrder(data);
          return;
        } catch {
          setOrder(null);
          return;
        }
      }
      try {
        const harvest = await getManagerAllHarvestOrders();
        const list = Array.isArray(harvest?.orders) ? harvest.orders : [];
        setOrder(list.find((o) => matchesScannedOrder(o, orderCode)) || null);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    load().finally(() => setLoading(false));
  }, [orderCode, isManager], 8000);

  const grades = useMemo(() => (order ? gradeRows(order) : []), [order]);

  if (loading) return <LoadingState rows={8} />;
  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description={`No order matched ${orderCode || "this QR"}.`}
        action={
          <Link to={isManager ? "/farmer/manager/orders" : "/farmer/orders/new"} className={EXCEL_BTN_PRIMARY}>
            Back to Orders
          </Link>
        }
      />
    );
  }

  const unit = order.unit || "Kg";
  const orderId = order.orderId || order.id;
  const productName = order.productName || order.name || order.products?.[0]?.name || "Harvest Order";
  const productId = formatProductBusinessId({
    productId: order.productId,
    name: productName,
    productName,
    variety: order.variety,
    category: order.category,
  });
  const totalQty =
    Number(order.orderedQuantity || order.totalQuantity || 0) || grades.reduce((s, g) => s + Number(g.qty || 0), 0);
  const orderValue = Number(order.orderValue || order.totalAmount || order.amount || 0);
  const packing = order.packingDetails || {};
  const pickup = order.pickup;
  const trackStatus = pickupFlowStatus(pickup, order.status);
  const showTracking = Boolean(PICKUP_STATUS_LABELS[trackStatus]) || Boolean(pickup);
  const farmerName = order.farmerName || order.farmer?.name || "—";
  const detailPath = isManager
    ? `/farmer/manager/orders/detail/${encodeURIComponent(orderId)}${order.farmerId ? `?farmerId=${encodeURIComponent(order.farmerId)}` : ""}`
    : `/farmer/orders/${encodeURIComponent(order.id || orderId)}`;

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <p className="text-[11px] font-semibold text-[#217346]">Scanned order</p>
      <StatusBadge status={order.status} />
      <div className="min-w-0">
        <h1 className="mt-0.5 text-lg font-bold text-[#1F2937]">{productName}</h1>
        <CopyId value={orderId} className="mt-0.5" textClassName="font-mono text-[11px] text-[#6B7280]" />
      </div>

      {rejectionText(order) ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-[#DC2626]">
          Rejected: {rejectionText(order)}
        </div>
      ) : null}

      {!isManager && showTracking ? (
        <Card title="Status">
          <PickupTimeline status={trackStatus} />
          <DriverInfo pickup={pickup} />
        </Card>
      ) : null}

      <Card title="Product">
        <p className="text-[15px] font-bold text-[#1F2937]">{productName}</p>
        {order.variety ? <p className="mt-0.5 text-[12px] text-[#6B7280]">Variety: {order.variety}</p> : null}
        <CopyId value={productId} className="mt-0.5" textClassName="font-mono text-[11px] text-emerald-700" breakAll />
        <p className="mt-1 text-[12px] text-[#6B7280]">
          Farmer: <span className="font-semibold text-[#1F2937]">{farmerName}</span>
        </p>
        {order.category ? <p className="mt-0.5 text-[11px] text-[#6B7280]">{order.category}</p> : null}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Fact label="Order date" value={dateDMY(order.orderDate || order.harvestDate || order.date || order.createdAt)} />
        <Fact label="Pickup date" value={dateDMY(order.pickupDate)} />
        <Fact label="Pickup time" value={time12h(order.pickupTime)} />
        <Fact label="Quantity" value={`${totalQty.toLocaleString("en-IN")} ${unit}`} />
      </div>

      <Card title="Grades">
        <div className="overflow-hidden rounded-md border border-[#E5E7EB]">
          <div className="grid grid-cols-4 bg-[#F8FAF8] px-2 py-1 text-[10px] font-bold text-[#6B7280]">
            <span>Grade</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </div>
          {grades.map((g) => (
            <div key={g.label} className="grid grid-cols-4 items-center border-t border-[#E5E7EB] px-2 py-1.5 text-[12px]">
              <span className="font-semibold">{g.label}</span>
              <span className="text-right tabular-nums">
                {Number(g.qty || 0).toLocaleString("en-IN")} {g.unit}
              </span>
              <span className="text-right tabular-nums">{g.rate ? formatMoney(g.rate) : "—"}</span>
              <span className="text-right font-semibold tabular-nums">{g.amount ? formatMoney(g.amount) : "—"}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-[12px] font-bold text-[#1F2937]">
          Value {formatMoney(orderValue) !== "—" ? formatMoney(orderValue) : formatMoney(grades.reduce((s, g) => s + Number(g.amount || 0), 0))}
        </p>
      </Card>

      <Card title="Packing">
        <div className="grid grid-cols-2 gap-2">
          <Fact label="Packed qty" value={order.packedQuantity ? `${order.packedQuantity} ${unit}` : "—"} />
          <Fact label="Packages" value={packing.packageCount || "—"} />
          <Fact label="Type" value={packing.packageType || "—"} />
          <Fact label="Weight" value={packing.packageWeight ? `${packing.packageWeight} ${unit}` : "—"} />
        </div>
        {packing.notes ? <p className="mt-2 text-[12px] text-[#6B7280]">{packing.notes}</p> : null}
      </Card>

      {isManager && pickup ? (
        <Card title="Pickup">
          <div className="grid grid-cols-2 gap-2">
            <Fact label="Driver" value={pickup.driverName || "—"} />
            <Fact label="Mobile" value={pickup.driverMobile || "—"} />
            <Fact label="Vehicle" value={pickup.vehicleNumber || "—"} />
            <Fact label="Status" value={pickup.status || "—"} />
          </div>
          {showTracking ? (
            <div className="mt-3">
              <PickupTimeline status={trackStatus} />
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Link to={isManager ? "/farmer/manager/orders" : "/farmer/orders/new"} className={`${EXCEL_BTN} !min-h-10 w-full sm:w-auto`}>
          Back
        </Link>
        <Link to={detailPath} className={`${EXCEL_BTN_PRIMARY} !min-h-10 w-full sm:w-auto`}>
          Open full order
        </Link>
      </div>
    </div>
  );
}
