import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteManagerFarmerOrder, getManagerAllHarvestOrders, getManagerFarmerById, getManagerFarmerOrderById } from "../../api/farmerApi";
import PickupTimeline, { pickupStatusLabel } from "../../components/pickup/PickupTimeline";
import { usePolling } from "../../hooks/usePolling";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import { formatMoney, formatOrderDate, rejectionText } from "../../utils/orderDisplay";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

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
    : [{ label: "Total", qty: Number(order.orderedQuantity || order.totalQuantity || 0), rate: 0, amount: 0, unit }];
}

function matchesOrderId(row, orderId) {
  const target = String(orderId || "");
  return [row?.id, row?.orderId].some((v) => String(v || "") === target);
}

async function loadManagerOrder(farmerId, orderId) {
  let order = null;
  if (farmerId) {
    try {
      const data = await getManagerFarmerOrderById(farmerId, orderId);
      order = data?.order || data;
      if (order && !(matchesOrderId(order, orderId) || order.farmerId)) order = null;
    } catch {
      order = null;
    }
  }
  if (!order) {
    const list = await getManagerAllHarvestOrders().catch(() => ({ orders: [] }));
    const orders = Array.isArray(list?.orders) ? list.orders : [];
    order =
      orders.find((o) => matchesOrderId(o, orderId) && (!farmerId || o.farmerId === farmerId)) ||
      orders.find((o) => matchesOrderId(o, orderId)) ||
      null;
  }
  if (!order) return null;

  const resolvedFarmerId = order.farmerId || farmerId;
  if (!resolvedFarmerId) return order;

  const needsFarmerMeta = !order.farmerName || !order.vendorId || !order.collectionCentreId;
  if (!needsFarmerMeta) return order;

  try {
    const farmer = await getManagerFarmerById(resolvedFarmerId);
    const name = farmer?.name || farmer?.farmer?.name || farmer?.data?.name || "";
    const vendorId = farmer?.vendorId || farmer?.farmer?.vendorId || order.vendorId || "";
    return {
      ...order,
      farmerName: order.farmerName || name || "",
      farmerId: resolvedFarmerId,
      vendorId: order.vendorId || vendorId || "",
      collectionCentre: order.collectionCentre || "",
      collectionCentreId: order.collectionCentreId || "",
    };
  } catch {
    return { ...order, farmerId: resolvedFarmerId };
  }
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

export default function ManagerOrderDetailPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const farmerId = searchParams.get("farmerId") || "";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  usePolling(() => {
    if (!orderId) {
      setLoading(false);
      setOrder(null);
      return;
    }
    loadManagerOrder(farmerId, decodeURIComponent(orderId))
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setOrder(null);
        setLoading(false);
      });
  }, [farmerId, orderId], 5000);

  const grades = useMemo(() => (order ? gradeRows(order) : []), [order]);

  if (loading) return <LoadingState rows={6} />;
  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order could not be loaded."
        action={
          <Link to="/farmer/manager/orders" className={EXCEL_BTN_PRIMARY}>
            Back to Orders
          </Link>
        }
      />
    );
  }

  const unit = order.unit || "Kg";
  const displayId = order.orderId || order.id || orderId;
  const resolvedFarmerId = order.farmerId || farmerId;
  const farmerName = order.farmerName || order.farmer?.name || "—";
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
  const pickup = order.pickup;

  const handleDelete = async () => {
    const id = order.orderId || order.id || orderId;
    if (!resolvedFarmerId || !id) {
      toast.error("Cannot delete: farmer or order id missing");
      return;
    }
    if (!window.confirm(`Delete order ${id}?`)) return;
    setDeleting(true);
    try {
      await deleteManagerFarmerOrder(resolvedFarmerId, id);
      toast.success("Order deleted");
      navigate("/farmer/manager/orders");
    } catch (err) {
      toast.error(err?.message || "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to="/farmer/manager/orders" className="text-[11px] font-semibold text-[#217346] hover:underline">
            ← Orders
          </Link>
          <h1 className="mt-0.5 text-lg font-bold text-[#1F2937]">{productName}</h1>
          <p className="mt-0.5 font-mono text-[11px] text-[#6B7280]">{displayId}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {reason ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-[#DC2626]">
          Rejected: {reason}
        </div>
      ) : null}

      <Card title="Product">
        <p className="text-[15px] font-bold text-[#1F2937]">{productName}</p>
        {order.variety ? <p className="mt-0.5 text-[12px] text-[#6B7280]">Variety: {order.variety}</p> : null}
        <p className="mt-0.5 break-all font-mono text-[11px] text-emerald-700">{productId}</p>
        <p className="mt-1 text-[12px] text-[#6B7280]">
          Farmer: <span className="font-semibold text-[#1F2937]">{farmerName}</span>
        </p>
        {order.collectionCentre || order.collectionCentreId ? (
          <p className="mt-0.5 text-[11px] text-[#6B7280]">
            Centre: {order.collectionCentre || order.collectionCentreId}
          </p>
        ) : null}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Fact label="Order date" value={dateDMY(order.orderDate || order.harvestDate || order.date || order.createdAt)} />
        <Fact label="Pickup date" value={dateDMY(order.pickupDate)} />
        <Fact label="Pickup time" value={time12h(order.pickupTime)} />
        <Fact label="Total qty" value={`${totalQty.toLocaleString("en-IN")} ${unit}`} />
      </div>

      <Card title="Grades">
        <div className="space-y-2">
          {grades.map((g) => (
            <div key={g.label} className="flex items-center justify-between gap-2 border-b border-[#F3F4F6] pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-[13px] font-semibold text-[#1F2937]">{g.label}</p>
                {Number(g.rate) > 0 ? (
                  <p className="text-[11px] text-[#6B7280]">{formatMoney(g.rate)} / {g.unit}</p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-[13px] font-bold text-[#217346]">
                  {Number(g.qty).toLocaleString("en-IN")} {g.unit}
                </p>
                {Number(g.amount) > 0 ? (
                  <p className="text-[11px] font-semibold text-[#1F2937]">{formatMoney(g.amount)}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[#E5E7EB] pt-2">
          <span className="text-[12px] font-semibold text-[#6B7280]">Order value</span>
          <span className="text-[15px] font-bold text-[#1F2937]">{formatMoney(orderValue)}</span>
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
        </Card>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Link to="/farmer/manager/orders" className={`${EXCEL_BTN} !min-h-10 w-full sm:w-auto`}>
          Back
        </Link>
        <button
          type="button"
          className={`${EXCEL_BTN_DANGER} !min-h-10 w-full sm:w-auto`}
          disabled={deleting || !resolvedFarmerId}
          onClick={handleDelete}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
