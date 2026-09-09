import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";
import {
  OrderStatusText,
  DriverAssignmentText,
  formatOrderTime,
  formatRupee,
  formatTripDuration,
  paymentMethodLabel,
  isCodPayment,
  getOrderItemsTotal,
  getOrderDeliveryFee,
  isInitialOrderStatus,
  allItemsAvailable,
  actionBtnPrimary,
  actionBtnDanger,
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
  const [confirmingCash, setConfirmingCash] = useState(false);

  const pendingSkuSet = useMemo(() => new Set(pendingSkus), [pendingSkus]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const load = useCallback(async () => {
    try {
      const [ord, req] = await Promise.all([
        managerApi.orders({
          status:
            "incoming,order_received,stock_issue,packed,offered,assigned,pickup_verified,out_for_delivery,delivered,cancelled",
        }),
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

  const onConfirmCashReceived = async () => {
    const oid = order?.id || order?._id;
    if (!oid || confirmingCash) return;
    setConfirmingCash(true);
    try {
      const res = await managerApi.confirmOrderCash(oid);
      showToast(res.data.message || "Cash received from delivery boy.");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not confirm cash receipt");
    } finally {
      setConfirmingCash(false);
    }
  };

  const onCancelOrder = async () => {
    const oid = order?.id || order?._id;
    if (!oid) return;
    if (!window.confirm(`Cancel order #${order.orderNumber || ""}? The customer order will also be cancelled.`)) return;
    setBusyKey(`cancel-${oid}`);
    try {
      const res = await managerApi.cancelOrder(oid);
      showToast(res.data.message || "Order cancelled");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not cancel order");
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
  const itemsTotal = getOrderItemsTotal(order);
  const deliveryFee = getOrderDeliveryFee(order);
  const orderTotal =
    Number(order?.orderTotal) ||
    Number(order?.amountToCollect) ||
    itemsTotal + deliveryFee;
  const isInitial = isInitialOrderStatus(order?.status);
  const allAvailable = allItemsAvailable(order);
  const oid = order?.id || order?._id;
  const isDelivered = order?.status === "delivered";
  const driverName =
    order?.assignedRider?.name ||
    order?.assignedRider?.phone ||
    "Unassigned";
  const collectInfo = order?.collectFromDriver;
  const collectAmount =
    Number(collectInfo?.amount) ||
    Number(order?.amountCollected) ||
    Number(order?.amountToCollect) ||
    orderTotal;
  const cashDone = order?.cashSettlement?.status === "COMPLETED";

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
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <button
              type="button"
              disabled={busyKey === `cancel-${oid}`}
              onClick={onCancelOrder}
              className={actionBtnDanger}
            >
              {busyKey === `cancel-${oid}` ? "Cancelling…" : "Cancel order"}
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

      {isDelivered && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Completed delivery
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                Order completed{order.deliveredAt ? ` · ${formatOrderTime(order.deliveredAt)}` : ""}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Driver: <span className="font-bold text-slate-900">{driverName}</span>
                {order.assignedRider?.phone ? (
                  <span className="text-slate-500"> · {order.assignedRider.phone}</span>
                ) : null}
              </p>
            </div>
            <div className="rounded-xl bg-white border border-emerald-200 px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Payment</p>
              <p className="text-sm font-extrabold text-slate-900">
                {paymentMethodLabel(order.paymentMethod)}
              </p>
            </div>
          </div>

          {isCodPayment(order.paymentMethod) && (
            <div
              className={`rounded-xl border px-4 py-3 ${
                cashDone
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  {cashDone ? (
                    <p className="text-sm font-semibold text-emerald-800">
                      ✓ Cash {formatRupee(collectAmount)} received from{" "}
                      <span className="font-extrabold">{driverName}</span> — credited to store
                    </p>
                  ) : (
                    <p className="text-sm font-extrabold text-amber-900">
                      Collect {formatRupee(collectAmount)} from driver ({driverName})
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-600">
                    COD — physical cash must be handed to this dark store.
                  </p>
                </div>
                {!cashDone && (
                  <button
                    type="button"
                    disabled={confirmingCash}
                    onClick={onConfirmCashReceived}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {confirmingCash ? (
                      "Confirming…"
                    ) : (
                      <>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border-2 border-white text-[11px]">
                          ✓
                        </span>
                        Received cash
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FeeStat
              label="Total time"
              value={formatTripDuration(order.tripDurationMinutes)}
              hint={
                order.deliveryDistanceKm
                  ? `${Number(order.deliveryDistanceKm).toFixed(1)} km`
                  : "Trip duration"
              }
            />
            <FeeStat
              label="Order total"
              value={formatRupee(orderTotal)}
              hint="Items + delivery"
            />
            <FeeStat
              label="Delivery charges"
              value={formatRupee(deliveryFee)}
              hint="Customer delivery fee"
            />
            <FeeStat
              label="Delivery boy fee"
              value={formatRupee(order.riderDeliveryEarning || 0)}
              hint={
                order.earningSlab?.riderAmount
                  ? `Slab ${order.earningSlab.minKm}–${order.earningSlab.maxKm} km`
                  : "Shift earning"
              }
            />
          </div>
        </div>
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
          {!isDelivered && order.paymentMethod && (
            <p className="mt-2 text-xs font-semibold text-slate-600">
              {paymentMethodLabel(order.paymentMethod)}
            </p>
          )}
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
          {itemsTotal > 0 && (
            <div className="rounded-xl bg-slate-50 px-4 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Items total</p>
              <p className="text-lg font-extrabold text-slate-900">{formatRupee(itemsTotal)}</p>
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
                          <p className="text-xs text-slate-500">Line total: {formatRupee(lineTotal)}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{item.sku || "—"}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{item.quantity}</td>
                      <td className="px-5 py-4 text-slate-600">{item.unit || "pcs"}</td>
                      <td className="px-5 py-4 text-slate-700">
                        {item.price != null ? formatRupee(item.price) : "—"}
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

function FeeStat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
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
