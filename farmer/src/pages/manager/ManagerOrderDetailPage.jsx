import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteManagerFarmerOrder, getManagerAllHarvestOrders, getManagerFarmerById, getManagerFarmerOrderById } from "../../api/farmerApi";
import { usePolling } from "../../hooks/usePolling";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import { formatMoney, formatOrderDate, rejectionText } from "../../utils/orderDisplay";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY, EXCEL_PAGE_TITLE } from "../../utils/excelStyles";

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
  return [...DEFAULT_GRADES, ...extras].map((label) => ({
    label,
    qty: map[label]?.qty || 0,
    rate: map[label]?.rate || 0,
    unit,
  }));
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

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#F3F4F6] py-2 last:border-0">
      <span className="shrink-0 text-[11px] font-semibold text-[#6B7280]">{label}</span>
      <span className="text-right text-[12px] font-semibold text-[#1F2937]">{value || "—"}</span>
    </div>
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
  const totalQty =
    Number(order.orderedQuantity || order.totalQuantity || 0) ||
    grades.reduce((s, g) => s + Number(g.qty || 0), 0);
  const orderValue = Number(order.orderValue || order.totalAmount || order.amount || 0);
  const productLabel = [order.productName || "Product", order.variety].filter(Boolean).join(" · ");
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
    <div className="mx-auto max-w-4xl space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to="/farmer/manager/orders" className="text-[11px] font-semibold text-[#217346] hover:underline">
            ← Back to Orders
          </Link>
          <h1 className={`${EXCEL_PAGE_TITLE} mt-1 break-all font-mono text-base sm:text-lg`}>{displayId}</h1>
          <p className="mt-0.5 text-[13px] font-semibold text-[#1F2937]">{productLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={order.status} />
          <button
            type="button"
            className={`${EXCEL_BTN_DANGER} !min-h-8 px-3 text-[11px]`}
            disabled={deleting || !resolvedFarmerId}
            onClick={handleDelete}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <Link to="/farmer/manager/orders" className={`${EXCEL_BTN} !min-h-8 px-3 text-[11px]`}>
            Back
          </Link>
        </div>
      </div>

      {reason ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-[#DC2626]">
          Rejected: {reason}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-start">
        {/* Left — Order Info */}
        <section className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 shadow-sm">
          <p className="border-b border-[#F3F4F6] py-2 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
            Order Info
          </p>
          <InfoRow label="Farmer" value={farmerName} />
          <InfoRow
            label="Order Date"
            value={dateDMY(order.orderDate || order.harvestDate || order.date || order.createdAt)}
          />
          <InfoRow label="Pickup Date" value={dateDMY(order.pickupDate)} />
          <InfoRow label="Pickup Time" value={time12h(order.pickupTime)} />
          <InfoRow
            label="Collection Centre"
            value={
              order.collectionCentre || order.collectionCentreId || order.vendorId
                ? (
                    <span className="inline-flex flex-col items-end gap-0.5">
                      <span>{order.collectionCentre || "Collection Centre"}</span>
                      <span className="font-mono text-[10px] font-semibold text-[#217346]">
                        {order.collectionCentreId || order.vendorId || "—"}
                      </span>
                    </span>
                  )
                : "—"
            }
          />
          <InfoRow label="Total Qty" value={`${totalQty.toLocaleString("en-IN")} ${unit}`} />
          <InfoRow label="Order Value" value={formatMoney(orderValue)} />
        </section>

        {/* Right — Grades */}
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <p className="border-b border-[#E5E7EB] bg-[#F8FAF8] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
            Grade Qty & Rate
          </p>
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#F9FAFB] text-left text-[11px] text-[#6B7280]">
                <th className="px-3 py-2 font-semibold">Grade</th>
                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                <th className="px-3 py-2 text-right font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => {
                const hasQty = Number(g.qty) > 0;
                return (
                  <tr key={g.label} className="border-t border-[#F3F4F6]">
                    <td className="px-3 py-2.5 font-semibold text-[#1F2937]">{g.label}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {hasQty ? (
                        <span className="font-semibold">
                          {Number(g.qty).toLocaleString("en-IN")} {g.unit}
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {hasQty && Number(g.rate) > 0 ? (
                        <span className="font-semibold">{formatMoney(g.rate)}</span>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      {/* Pickup — only if present */}
      {pickup ? (
        <section className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 shadow-sm">
          <p className="border-b border-[#F3F4F6] py-2 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
            Pickup
          </p>
          <InfoRow label="Driver" value={pickup.driverName || "Not assigned"} />
          <InfoRow label="Mobile" value={pickup.driverMobile || "—"} />
          <InfoRow label="Vehicle" value={pickup.vehicleNumber || "—"} />
          <InfoRow
            label="Status"
            value={String(pickup.liveStatus || pickup.status || "—").replace(/_/g, " ")}
          />
        </section>
      ) : null}
    </div>
  );
}
