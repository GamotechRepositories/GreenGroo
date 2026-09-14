import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  deleteManagerFarmerOrder,
  getManagerAllHarvestOrders,
  getManagerFarmerById,
  getManagerFarmerOrderById,
} from "../../api/managerPortApi";
import StatusBadge from "../../components/ui/StatusBadge";
import CopyId from "../../components/ui/CopyId";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import { formatMoney, formatOrderDate } from "../../utils/orderDisplay";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY, EXCEL_PANEL } from "../../utils/excelStyles";

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

function gradeRows(order) {
  const unit = order?.unit || "Kg";
  const map = {};
  (Array.isArray(order?.grades) ? order.grades : []).forEach((g) => {
    const label = String(g.label || g.name || "").trim();
    if (!label) return;
    if (!map[label]) map[label] = { qty: 0, rate: 0 };
    map[label].qty += Number(g.quantity || 0);
    const rate = Number(g.price ?? g.rate ?? g.pricePerKg ?? 0) || 0;
    if (rate > 0) map[label].rate = rate;
  });
  if (!Object.keys(map).length) {
    const label = String(order?.grade || "Grade A").trim() || "Grade A";
    map[label] = {
      qty: Number(order?.orderedQuantity || order?.totalQuantity || 0),
      rate: Number(order?.price || 0) || 0,
    };
  }
  const extras = Object.keys(map).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
  return [...DEFAULT_GRADES, ...extras]
    .filter((label) => Number(map[label]?.qty || 0) > 0)
    .map((label) => ({
      label,
      qty: map[label].qty,
      rate: map[label].rate,
      amount: map[label].qty * map[label].rate,
      unit,
    }));
}

export default function ManagerOrderDetailPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const farmerIdParam = searchParams.get("farmerId") || "";
  const [order, setOrder] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let found = null;
        let fid = farmerIdParam;
        if (fid) {
          found = await getManagerFarmerOrderById(fid, orderId).catch(() => null);
        }
        if (!found) {
          const all = await getManagerAllHarvestOrders().catch(() => ({ orders: [] }));
          found = (all.orders || []).find(
            (o) => String(o.id || o.orderId || o._id) === String(orderId)
          );
          if (found?.farmerId) fid = found.farmerId;
        }
        if (!cancelled) setOrder(found || null);
        if (fid) {
          const f = await getManagerFarmerById(fid).catch(() => null);
          if (!cancelled) setFarmer(f);
        }
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, farmerIdParam]);

  const rows = useMemo(() => gradeRows(order), [order]);
  const farmerId = order?.farmerId || farmerIdParam || farmer?.id || "";
  const id = order?.id || order?.orderId || orderId;
  const productName = order?.productName || order?.products?.[0]?.name || "Farm Produce";
  const value = Number(order?.totalAmount || order?.orderValue || order?.amount || 0);

  const handleDelete = async () => {
    if (!farmerId || !id) {
      toast.error("Cannot delete: farmer or order id missing");
      return;
    }
    if (!window.confirm(`Delete order ${id}?`)) return;
    setDeleting(true);
    try {
      await deleteManagerFarmerOrder(farmerId, id);
      toast.success("Order deleted");
      window.location.href = "/vendor/orders";
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState rows={6} />;
  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This harvest order may have been deleted."
        action={
          <Link to="/vendor/orders" className={EXCEL_BTN_PRIMARY}>
            Back to Orders
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/vendor/orders" className="mb-1 inline-block text-[12px] font-semibold text-[#217346]">
            ← Orders
          </Link>
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{productName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <CopyId value={id} />
            <StatusBadge status={order.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/vendor/orders/create?farmerId=${encodeURIComponent(farmerId)}&productId=${encodeURIComponent(order.productId || "")}&edit=${encodeURIComponent(id)}`}
            className={EXCEL_BTN}
          >
            Edit
          </Link>
          <button type="button" className={EXCEL_BTN_DANGER} disabled={deleting || !farmerId} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Order date", value: formatOrderDate(order.orderDate || order.harvestDate || order.createdAt) },
          { label: "Pickup date", value: formatOrderDate(order.pickupDate) },
          { label: "Pickup time", value: order.pickupTime || "—" },
          { label: "Order value", value: formatMoney(value) },
        ].map((s) => (
          <div key={s.label} className={`${EXCEL_PANEL} p-3`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className={EXCEL_PANEL}>
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Farmer</div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
          <div>
            <p className="font-semibold text-slate-900">{farmer?.name || order.farmerName || "—"}</p>
            <p className="text-xs text-slate-500">{farmer?.mobile || order.farmerMobile || ""}</p>
          </div>
          {farmerId ? (
            <Link to={`/vendor/all-farmers/${farmerId}`} className={EXCEL_BTN}>
              View farmer
            </Link>
          ) : null}
        </div>
      </div>

      <div className={EXCEL_PANEL}>
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Product & grades</div>
        <div className="px-4 py-3 text-xs text-slate-500">
          Product ID: <CopyId value={formatProductBusinessId(order)} textClassName="font-mono text-[11px] text-emerald-700" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500">
                {["Grade", "Qty", "Rate", "Amount"].map((h) => (
                  <th key={h} className="px-4 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-semibold">{r.label}</td>
                  <td className="px-4 py-2">
                    {r.qty.toLocaleString("en-IN")} {r.unit}
                  </td>
                  <td className="px-4 py-2">₹{Number(r.rate || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2 font-semibold">{formatMoney(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
