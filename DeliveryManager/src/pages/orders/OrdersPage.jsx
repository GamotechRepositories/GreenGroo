import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import PickupQrModal from "../../components/PickupQrModal";
import { subscribeToSocketEvent } from "../../services/socket";
import { STATUS_TABS, matchesTab, OrderStatusText, DriverAssignmentText, isInitialOrderStatus, allItemsAvailable, actionBtnOutline, actionBtnPrimary } from "./orderUtils";

export default function OrdersPage() {
  const { manager } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [onlineRiders, setOnlineRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [pickupQrOrderId, setPickupQrOrderId] = useState(null);
  const [pickupQrLoading, setPickupQrLoading] = useState(false);
  const [pickupQrError, setPickupQrError] = useState("");
  const [pickupQrData, setPickupQrData] = useState(null);

  const load = useCallback(async () => {
    try {
      const [ord, rid] = await Promise.all([
        managerApi.orders(),
        managerApi.riders(),
      ]);
      setOrders(ord.data.orders || []);
      setOnlineRiders((rid.data.riders || []).filter((r) => r.status === "online"));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    const unsubs = [
      subscribeToSocketEvent("new_order_received", () => load()),
      subscribeToSocketEvent("order_status_updated", () => load()),
      subscribeToSocketEvent("driver_assigned", () => load()),
      subscribeToSocketEvent("search_driver", () => load()),
      subscribeToSocketEvent("dispatch_no_riders_available", () => load()),
      subscribeToSocketEvent("pickup_verified", () => load()),
      subscribeToSocketEvent("pickup_qr_scanned", () => load()),
      subscribeToSocketEvent("pickup_proof_submitted", () => load()),
      subscribeToSocketEvent("order_out_for_delivery", () => load()),
    ];
    return () => {
      clearInterval(id);
      unsubs.forEach((unsub) => unsub());
    };
  }, [load]);

  const openPickupQr = async (orderId) => {
    setPickupQrOrderId(orderId);
    setPickupQrLoading(true);
    setPickupQrError("");
    setPickupQrData(null);
    try {
      const res = await managerApi.getPickupQr(orderId);
      setPickupQrData(res.data);
    } catch (err) {
      setPickupQrError(err.response?.data?.message || "Could not load pickup QR");
    } finally {
      setPickupQrLoading(false);
    }
  };

  const closePickupQr = () => {
    setPickupQrOrderId(null);
    setPickupQrData(null);
    setPickupQrError("");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const formatShortages = (shortages) =>
    (shortages || [])
      .map((s) => `${s.name} (need ${s.needed}, have ${s.available})`)
      .join("; ");

  const onPackOrder = async (orderId) => {
    const key = `pack-${orderId}`;
    setBusyKey(key);
    try {
      const res = await managerApi.packOrder(orderId);
      showToast(res.data.message || "Order confirmed — stock deducted from this dark store.");
      await load();
    } catch (err) {
      const shortages = formatShortages(err.response?.data?.shortages);
      showToast(
        shortages
          ? `Cannot confirm: ${shortages}. Request inventory or inform the customer.`
          : err.response?.data?.message || "Confirm order failed"
      );
    } finally {
      setBusyKey("");
    }
  };

  const onApprovePickupProof = async (orderId) => {
    const key = `approve-proof-${orderId}`;
    setBusyKey(key);
    try {
      const res = await managerApi.approvePickupProof(orderId);
      showToast(res.data.message || "Item proof approved. Driver address unlocked.");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not approve item proof");
    } finally {
      setBusyKey("");
    }
  };

  const onManualAssign = async (orderId) => {
    const riderId = selectedRider[orderId];
    if (!riderId) return;
    const key = `assign-${orderId}`;
    setBusyKey(key);
    try {
      const res = await managerApi.assignOrder(orderId, riderId);
      showToast(res.data.message || "Rider assigned");
      setSelectedRider((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
      await load();
    } catch (err) {
      const shortages = formatShortages(err.response?.data?.shortages);
      showToast(
        shortages
          ? `Cannot assign: ${shortages}`
          : err.response?.data?.message || "Assignment failed"
      );
    } finally {
      setBusyKey("");
    }
  };

  const onCreateDemoOrder = async () => {
    setBusyKey("create-demo");
    try {
      const res = await managerApi.createDemoOrder();
      showToast(res.data.message || "Incoming order generated! Review & click 'Mark Packed' when ready.");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to generate incoming order");
    } finally {
      setBusyKey("");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (o.orderNumber || "").toLowerCase().includes(q) ||
      (o.customerName || "").toLowerCase().includes(q) ||
      (o.customerPhone || "").includes(q) ||
      (o.customerAddress || "").toLowerCase().includes(q);
    return matchSearch && matchesTab(o, activeTab);
  });

  const activeCount = orders.filter((o) => matchesTab(o, "active")).length;

  return (
    <PageShell
      title="Incoming Orders"
      subtitle={`${manager?.storeName || "Dark Store"} · ${manager?.area || "Area"}, ${manager?.city || "City"} · orders within ${manager?.deliveryRadiusKm || 5} km`}
    >
      {toast && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-3 text-sm font-bold text-emerald-800 flex items-center gap-2 animate-fade-in">
          ⚡ {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Online Riders Bar */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Online Drivers:</span>
        {onlineRiders.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No drivers online right now</span>
        ) : (
          onlineRiders.map((r) => (
            <span
              key={r.id || r._id}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {r.name || r.phone}
            </span>
          ))
        )}
        <span className="ml-auto text-xs text-slate-400">{onlineRiders.length} online</span>
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, phone…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600">✕</button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCreateDemoOrder}
              disabled={busyKey === "create-demo"}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
            >
              ➕ Generate Incoming Order
            </button>
            <Link
              to="/stock"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              View Inventory
            </Link>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              {tab.id === "active" && activeCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-400 text-slate-900 px-1.5 py-0.5 text-[10px] font-extrabold">
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <h3 className="text-sm font-bold text-slate-800">No Orders Found</h3>
          <p className="mt-1 text-xs text-slate-400">
            {searchQuery ? "No orders match your search." : "No orders in this category right now."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-black text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-2 px-4">Order # / Date</th>
                <th className="py-2 px-4">Customer Details</th>
                <th className="py-2 px-4">Delivery Address</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Assigned Driver</th>
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const oid = order.id || order._id;
                const isInitial = isInitialOrderStatus(order.status);
                const isPacked = order.status === "packed";
                const allAvailable = allItemsAvailable(order);

                return (
                  <tr key={oid} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div>#{order.orderNumber}</div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.customerName || "Customer"}</div>
                      <div className="text-slate-500 text-[11px]">{order.customerPhone || "N/A"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs">
                      <div className="truncate">{order.customerAddress || "Store Pickup"}</div>
                      {order.distanceKm != null && (
                        <div className="mt-0.5 text-[10px] font-semibold text-emerald-700">
                          {Number(order.distanceKm).toFixed(1)} km from this store
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <OrderStatusText status={order.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <DriverAssignmentText order={order} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/orders/${oid}`, { state: { order } })}
                            className={actionBtnOutline}
                          >
                            View Detail
                          </button>
                          {isInitial && (
                            <button
                              type="button"
                              disabled={!allAvailable || busyKey === `pack-${oid}`}
                              onClick={() => onPackOrder(oid)}
                              className={actionBtnPrimary}
                            >
                              {busyKey === `pack-${oid}` ? "Confirming…" : "Confirm & Pack"}
                            </button>
                          )}
                        </div>
                        {isInitial && !allAvailable && (
                          <p className="text-[10px] text-rose-600 font-semibold max-w-[220px] text-right">
                            Out of stock — request inventory first
                          </p>
                        )}
                        {order.status === "assigned" && !order.pickupQrScanned && !order.pickupVerified && (
                          <button
                            type="button"
                            onClick={() => openPickupQr(oid)}
                            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                          >
                            Show Pickup QR
                          </button>
                        )}
                        {order.pickupProofStatus === "pending" && order.pickupProofImageUrl && (
                          <div className="flex flex-col items-end gap-2 max-w-[180px]">
                            <img
                              src={order.pickupProofImageUrl}
                              alt="Item proof"
                              className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                            />
                            <button
                              type="button"
                              disabled={busyKey === `approve-proof-${oid}`}
                              onClick={() => onApprovePickupProof(oid)}
                              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {busyKey === `approve-proof-${oid}` ? "Approving…" : "✓ Approve Item Proof"}
                            </button>
                          </div>
                        )}
                        {(isInitial || isPacked) && (
                          <div className="flex items-center gap-1">
                            <select
                              value={selectedRider[oid] || ""}
                              onChange={(e) =>
                                setSelectedRider((prev) => ({ ...prev, [oid]: e.target.value }))
                              }
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none"
                            >
                              <option value="">Rider…</option>
                              {onlineRiders.map((r) => (
                                <option key={r.id || r._id} value={r.id || r._id}>
                                  {r.name || r.phone}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={!selectedRider[oid] || busyKey === `assign-${oid}`}
                              onClick={() => onManualAssign(oid)}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                            >
                              Assign
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PickupQrModal
        isOpen={Boolean(pickupQrOrderId)}
        onClose={closePickupQr}
        loading={pickupQrLoading}
        error={pickupQrError}
        orderNumber={pickupQrData?.orderNumber}
        driverName={pickupQrData?.driverName}
        pickupQrPayload={pickupQrData?.pickupQrPayload}
      />
    </PageShell>
  );
}
