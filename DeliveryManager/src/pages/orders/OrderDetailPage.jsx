import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";
import {
  OrderStatusText,
  DriverAssignmentText,
  formatOrderTime,
  isInitialOrderStatus,
  allItemsAvailable,
  actionBtnPrimary,
} from "./orderUtils";

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialOrder = location.state?.order || null;

  const [order, setOrder] = useState(initialOrder);
  const [pendingSkus, setPendingSkus] = useState([]);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [toast, setToast] = useState("");
  const [requestItem, setRequestItem] = useState(null);
  const [requestQty, setRequestQty] = useState(20);
  const [requestNote, setRequestNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pendingSkuSet = useMemo(() => new Set(pendingSkus), [pendingSkus]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const load = useCallback(async () => {
    try {
      const [ord, req] = await Promise.all([
        managerApi.orders(),
        managerApi.listInventoryRequests({ status: "pending" }).catch(() => ({ data: { requests: [] } })),
      ]);

      const found = (ord.data.orders || []).find(
        (o) => String(o.id || o._id) === String(orderId)
      );

      if (!found) {
        setError("Order not found or no longer available.");
        setOrder(null);
      } else {
        setOrder(found);
        setError("");
      }

      setPendingSkus(
        (req.data.requests || [])
          .filter((r) => r.status === "pending")
          .map((r) => r.sku)
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const onInform = async (itemId) => {
    const oid = order?.id || order?._id;
    const key = `inform-${oid}-${itemId}`;
    setBusyKey(key);
    try {
      const res = await managerApi.informCustomer(oid, itemId);
      showToast(res.data.message || "Customer informed");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed");
    } finally {
      setBusyKey("");
    }
  };

  const openRequest = (item) => {
    setRequestItem(item);
    setRequestQty(Math.max(20, (item.quantity || 1) * 3));
    setRequestNote(
      `Need restock to confirm order #${order?.orderNumber || ""} — currently ${item.availableStock ?? 0} ${item.unit || "pcs"} in this dark store`
    );
  };

  const onApprovePickupProof = async () => {
    const oid = order?.id || order?._id;
    if (!oid) return;
    setBusyKey(`approve-proof-${oid}`);
    try {
      const res = await managerApi.approvePickupProof(oid);
      showToast(res.data.message || "Item proof approved. Driver can navigate to customer.");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not approve item proof");
    } finally {
      setBusyKey("");
    }
  };

  const onPackOrder = async () => {
    const oid = order?.id || order?._id;
    if (!oid) return;
    setBusyKey(`pack-${oid}`);
    try {
      const res = await managerApi.packOrder(oid);
      showToast(res.data.message || "Order confirmed — stock deducted from this dark store.");
      await load();
    } catch (err) {
      const shortages = (err.response?.data?.shortages || [])
        .map((s) => `${s.name} (need ${s.needed}, have ${s.available})`)
        .join("; ");
      showToast(
        shortages
          ? `Cannot confirm: ${shortages}. Request inventory or inform the customer.`
          : err.response?.data?.message || "Confirm order failed"
      );
    } finally {
      setBusyKey("");
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!requestItem) return;
    setSubmitting(true);
    try {
      const res = await managerApi.requestInventory({
        sku: requestItem.sku,
        productName: requestItem.name,
        unit: requestItem.unit,
        quantity: Number(requestQty),
        note: requestNote,
      });
      showToast(res.data.message || "Request sent to Product Manager");
      setRequestItem(null);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const items = order?.items || [];
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const estimatedTotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 0),
    0
  );
  const isInitial = isInitialOrderStatus(order?.status);
  const allAvailable = allItemsAvailable(order);
  const oid = order?.id || order?._id;

  if (loading && !order) {
    return (
      <PageShell title="Order Details" subtitle="Loading order…">
        <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell title="Order Details" subtitle="Order not found">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back to Orders
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Order #${order.orderNumber}`}
      subtitle={`Placed ${formatOrderTime(order.createdAt)}`}
    >
      {toast && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
          ⚡ {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back to Orders
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {isInitial && (
            <button
              type="button"
              disabled={!allAvailable || busyKey === `pack-${oid}`}
              onClick={onPackOrder}
              className={actionBtnPrimary}
            >
              {busyKey === `pack-${oid}` ? "Confirming…" : "Confirm & Pack"}
            </button>
          )}
          <Link
            to="/orders"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View All Orders
          </Link>
        </div>
      </div>
      {isInitial && !allAvailable && (
        <p className="text-xs font-semibold text-rose-600">
          Out of stock — request inventory or inform the customer before confirming.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="Customer">
          <p className="font-bold text-slate-900">{order.customerName || "Customer"}</p>
          <p className="text-sm text-slate-500">{order.customerPhone || "N/A"}</p>
        </InfoCard>
        <InfoCard title="Delivery Address">
          <p className="text-sm text-slate-700 leading-relaxed">{order.customerAddress || "Store Pickup"}</p>
          {order.distanceKm != null && (
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              {Number(order.distanceKm).toFixed(1)} km from this store
            </p>
          )}
        </InfoCard>
        <InfoCard title="Status">
          <OrderStatusText status={order.status} />
        </InfoCard>
        <InfoCard title="Assigned Driver">
          <DriverAssignmentText order={order} />
        </InfoCard>
      </div>

      {order.pickupProofStatus === "pending" && order.pickupProofImageUrl && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Item Proof — Pending Approval
              </p>
              <p className="mt-1 text-sm text-amber-900">
                Driver sent a photo of packed items. Approve to unlock customer address.
              </p>
            </div>
            <button
              type="button"
              disabled={busyKey === `approve-proof-${oid}`}
              onClick={onApprovePickupProof}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busyKey === `approve-proof-${oid}` ? "Approving…" : "✓ Approve & Unlock Address"}
            </button>
          </div>
          <div className="mt-4">
            <img
              src={order.pickupProofImageUrl}
              alt="Item proof from driver"
              className="max-h-80 w-full max-w-md rounded-xl border border-amber-200 object-contain bg-white"
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Order Items</h3>
            <p className="text-xs text-slate-500">
              {items.length} product{items.length === 1 ? "" : "s"} · {itemCount} total units
            </p>
          </div>
          {estimatedTotal > 0 && (
            <div className="rounded-xl bg-slate-50 px-4 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Est. value</p>
              <p className="text-lg font-extrabold text-slate-900">₹{estimatedTotal.toLocaleString("en-IN")}</p>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">Unit</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                    No items in this order.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const itemId = item.id || item._id;
                  const inStock = item.stockStatus === "available";
                  const avail = item.availableStock ?? 0;
                  const pending = pendingSkuSet.has(item.sku);
                  const lineTotal = (Number(item.price) || 0) * (item.quantity || 0);

                  return (
                    <tr key={itemId} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        {lineTotal > 0 && (
                          <p className="text-xs text-slate-500">Line total: ₹{lineTotal.toLocaleString("en-IN")}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{item.sku || "—"}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{item.quantity}</td>
                      <td className="px-5 py-4 text-slate-600">{item.unit || "pcs"}</td>
                      <td className="px-5 py-4 text-slate-700">
                        {item.price != null ? `₹${Number(item.price).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            inStock
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {inStock ? `${avail} in stock` : `only ${avail} left`}
                        </span>
                        {item.customerInformed && (
                          <p className="mt-1 text-[10px] font-semibold text-amber-700">Customer informed</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          {!inStock && !item.customerInformed && (
                            <button
                              type="button"
                              disabled={busyKey === `inform-${order.id || order._id}-${itemId}`}
                              onClick={() => onInform(itemId)}
                              className="rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-800 border border-amber-200 hover:bg-amber-100"
                            >
                              Inform Customer
                            </button>
                          )}
                          {!inStock && (
                            pending ? (
                              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-amber-700">
                                Stock Requested
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openRequest(item)}
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800"
                              >
                                Request Stock
                              </button>
                            )
                          )}
                          {inStock && (
                            <span className="text-[11px] font-semibold text-emerald-700">Ready</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {requestItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form
            onSubmit={submitRequest}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">Request inventory</h3>
              <p className="mt-1 text-xs text-slate-500">
                Sends a restock request to Product Manager for{" "}
                <span className="font-semibold">{requestItem.name}</span>
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Current stock:{" "}
              <strong>
                {requestItem.availableStock ?? 0} {requestItem.unit || "pcs"}
              </strong>{" "}
              · SKU {requestItem.sku}
            </div>
            <label className="block text-xs font-bold text-slate-700">
              Quantity to request
              <input
                type="number"
                min={1}
                required
                value={requestQty}
                onChange={(e) => setRequestQty(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
              />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Note for Product Manager
              <textarea
                rows={3}
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestItem(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send to Product Manager"}
              </button>
            </div>
          </form>
        </div>
      )}
    </PageShell>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
