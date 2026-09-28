import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import PickupQrModal from "../../components/PickupQrModal";
import { useStoreRealtimeRefresh } from "../../hooks/useStoreRealtimeRefresh";
import { ensureStoreRoom } from "../../services/socket";
import {
  OrderStatusText,
  actionBtnDanger,
  actionBtnOutline,
  actionBtnPrimary,
  formatRupee,
  isCodPayment,
} from "../orders/orderUtils";

const TABS = [
  { id: "to_assign", label: "Ready to Assign" },
  { id: "with_pm", label: "With Product Manager" },
  { id: "on_the_way", label: "Assigned / On the way" },
  { id: "delivered", label: "Delivered" },
  { id: "closed", label: "Cancelled / Failed" },
  { id: "all", label: "All" },
];

const STAGE_LABELS = {
  pending: { text: "Pending prep", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  preparing: { text: "Preparing", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  ready: { text: "Ready at PM", className: "bg-sky-50 text-sky-800 ring-sky-200" },
  forwarded: { text: "Forwarded", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
};

function matchesTab(order, tab) {
  const s = order.status;
  if (tab === "all") return true;
  if (tab === "to_assign") return s === "packed" || s === "offered";
  if (tab === "with_pm") return s === "preorder_hold";
  if (tab === "on_the_way") return ["assigned", "pickup_verified", "out_for_delivery"].includes(s);
  if (tab === "delivered") return s === "delivered";
  if (tab === "closed") return s === "cancelled" || s === "delivery_failed";
  return true;
}

function formatDayLabel(dateStr, today, tomorrow) {
  if (!dateStr) return "No date";
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isAssignableRider(rider) {
  return rider.isActive !== false && rider.status === "online" && !rider.activeOrderId;
}

export default function PreOrdersPage() {
  const { manager } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [meta, setMeta] = useState({ today: "", tomorrow: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [activeTab, setActiveTab] = useState("to_assign");
  const [dateFilter, setDateFilter] = useState("");
  const [slotFilter, setSlotFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRider, setSelectedRider] = useState({});
  const [nowTick, setNowTick] = useState(Date.now());
  const [pickupQr, setPickupQr] = useState({ orderId: null, loading: false, error: "", data: null });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const [pre, rid] = await Promise.all([
          managerApi.preOrders(dateFilter ? { date: dateFilter } : {}),
          managerApi.riders(),
        ]);
        setOrders(pre.data.orders || []);
        setMeta({ today: pre.data.today || "", tomorrow: pre.data.tomorrow || "" });
        setRiders(rid.data.riders || []);
        setError("");
      } catch (err) {
        if (!silent) setError(err.response?.data?.message || "Failed to load pre-orders");
      } finally {
        setLoading(false);
      }
    },
    [dateFilter]
  );

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!manager?.id) return undefined;
    ensureStoreRoom(manager.id);
    const keepAlive = setInterval(() => ensureStoreRoom(manager.id), 15000);
    return () => clearInterval(keepAlive);
  }, [manager?.id]);

  useStoreRealtimeRefresh(() => load({ silent: true }), { backupMs: 15000 });

  const assignableRiders = useMemo(() => riders.filter(isAssignableRider), [riders]);
  const unavailableRiders = useMemo(
    () => riders.filter((r) => r.isActive !== false && !isAssignableRider(r)),
    [riders]
  );

  const slots = useMemo(
    () => [...new Set(orders.map((o) => o.preOrderSlot).filter(Boolean))].sort(),
    [orders]
  );

  const counts = useMemo(() => {
    const c = {};
    for (const tab of TABS) c[tab.id] = orders.filter((o) => matchesTab(o, tab.id)).length;
    return c;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (!matchesTab(o, activeTab)) return false;
      if (slotFilter && o.preOrderSlot !== slotFilter) return false;
      if (!q) return true;
      return (
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").includes(q) ||
        (o.customerAddress || "").toLowerCase().includes(q)
      );
    });
  }, [orders, activeTab, slotFilter, searchQuery]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const o of visibleOrders) {
      const key = `${o.preOrderDate || ""}__${o.preOrderSlot || ""}`;
      if (!map.has(key)) {
        map.set(key, { key, date: o.preOrderDate, slot: o.preOrderSlot, orders: [] });
      }
      map.get(key).orders.push(o);
    }
    return [...map.values()];
  }, [visibleOrders]);

  const onAssign = async (order) => {
    const oid = order.id;
    const riderId = selectedRider[oid];
    if (!riderId) return;
    setBusyKey(`assign-${oid}`);
    try {
      const res = await managerApi.assignOrder(oid, riderId);
      showToast(res.data.message || "Offer sent — rider must Accept / Decline");
      setSelectedRider((prev) => {
        const next = { ...prev };
        delete next[oid];
        return next;
      });
      await load({ silent: true });
    } catch (err) {
      showToast(err.response?.data?.message || "Could not assign rider");
    } finally {
      setBusyKey("");
    }
  };

  const onCancel = async (order) => {
    if (!window.confirm(`Cancel pre-order #${order.orderNumber}? The customer order will also be cancelled.`)) {
      return;
    }
    setBusyKey(`cancel-${order.id}`);
    try {
      const res = await managerApi.cancelOrder(order.id);
      showToast(res.data.message || "Pre-order cancelled");
      await load({ silent: true });
    } catch (err) {
      showToast(err.response?.data?.message || "Could not cancel pre-order");
    } finally {
      setBusyKey("");
    }
  };

  const onApproveProof = async (order) => {
    setBusyKey(`proof-${order.id}`);
    try {
      const res = await managerApi.approvePickupProof(order.id);
      showToast(res.data.message || "Item proof approved. Address unlocked for rider.");
      await load({ silent: true });
    } catch (err) {
      showToast(err.response?.data?.message || "Could not approve item proof");
    } finally {
      setBusyKey("");
    }
  };

  const openPickupQr = async (orderId) => {
    setPickupQr({ orderId, loading: true, error: "", data: null });
    try {
      const res = await managerApi.getPickupQr(orderId);
      setPickupQr({ orderId, loading: false, error: "", data: res.data });
    } catch (err) {
      setPickupQr({
        orderId,
        loading: false,
        error: err.response?.data?.message || "Could not load pickup QR",
        data: null,
      });
    }
  };

  const summaryCards = [
    {
      id: "to_assign",
      label: "Ready to assign",
      hint: "Forwarded by Product Manager",
      accent: "border-emerald-200 bg-emerald-50",
      countClass: "text-emerald-800",
      ring: "ring-emerald-500",
    },
    {
      id: "with_pm",
      label: "With Product Manager",
      hint: "Being prepared — not yet forwarded",
      accent: "border-indigo-200 bg-indigo-50",
      countClass: "text-indigo-800",
      ring: "ring-indigo-500",
    },
    {
      id: "on_the_way",
      label: "Assigned / On the way",
      hint: "Rider accepted",
      accent: "border-amber-200 bg-amber-50",
      countClass: "text-amber-800",
      ring: "ring-amber-500",
    },
    {
      id: "delivered",
      label: "Delivered",
      hint: "Completed pre-orders",
      accent: "border-slate-200 bg-white",
      countClass: "text-slate-800",
      ring: "ring-slate-500",
    },
  ];

  return (
    <PageShell
      title="Pre-Orders"
      subtitle={`${manager?.storeName || "Dark Store"} · Next-day slot orders. The Product Manager prepares and forwards them — you assign riders manually.`}
    >
      {toast && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
          ⚡ {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setActiveTab(card.id)}
            className={`rounded-2xl border p-4 text-left shadow-xs transition ${card.accent} ${
              activeTab === card.id ? `ring-2 ${card.ring}` : "hover:shadow-sm"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{card.label}</p>
            <p className={`mt-1 text-3xl font-black ${card.countClass}`}>{counts[card.id] || 0}</p>
            <p className="mt-1 text-[11px] text-slate-500">{card.hint}</p>
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, phone…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none sm:w-64"
          />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All upcoming & open</option>
            {meta.today && <option value={meta.today}>Today ({meta.today})</option>}
            {meta.tomorrow && <option value={meta.tomorrow}>Tomorrow ({meta.tomorrow})</option>}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          />
          <select
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All slots</option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-200">
              {assignableRiders.length} rider{assignableRiders.length === 1 ? "" : "s"} free
            </span>
            <button type="button" onClick={() => load()} className={actionBtnOutline}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {counts[tab.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/60" />
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <h3 className="text-sm font-bold text-slate-800">No pre-orders here</h3>
          <p className="mt-1 text-xs text-slate-400">
            {activeTab === "to_assign"
              ? "Pre-orders appear here once the Product Manager forwards them."
              : "Nothing matches the selected filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <header className="flex flex-wrap items-center justify-between gap-2 bg-black px-4 py-2.5 text-white">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span>{formatDayLabel(group.date, meta.today, meta.tomorrow)}</span>
                  <span className="text-white/40">·</span>
                  <span className="text-emerald-300">{group.slot || "No slot"}</span>
                </div>
                <span className="text-xs font-semibold text-white/70">
                  {group.orders.length} order{group.orders.length === 1 ? "" : "s"}
                </span>
              </header>

              <div className="divide-y divide-slate-100">
                {group.orders.map((order) => {
                  const oid = order.id;
                  const stage = STAGE_LABELS[order.preOrderStage] || null;
                  const isClosed = ["delivered", "cancelled", "delivery_failed"].includes(order.status);
                  const canAssign = order.status === "packed" || order.status === "offered";
                  const offerMsLeft =
                    order.status === "offered" && order.offerExpiresAt
                      ? Math.max(0, new Date(order.offerExpiresAt).getTime() - nowTick)
                      : 0;
                  const showQr =
                    order.status === "assigned" && !order.pickupQrScanned && !order.pickupVerified;

                  return (
                    <div key={oid} className="grid gap-4 p-4 lg:grid-cols-[1.3fr_1fr_1fr]">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/orders/${oid}`, { state: { order } })}
                            className="font-mono text-sm font-bold text-slate-900 hover:text-emerald-700 hover:underline"
                          >
                            #{order.orderNumber}
                          </button>
                          <OrderStatusText status={order.status} />
                          {stage && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${stage.className}`}>
                              {stage.text}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {order.customerName || "Customer"}{" "}
                          <span className="text-xs font-normal text-slate-500">{order.customerPhone}</span>
                        </p>
                        <p className="line-clamp-2 text-xs text-slate-600">{order.customerAddress}</p>
                        {order.distanceKm != null && (
                          <p className="text-[10px] font-semibold text-emerald-700">
                            {Number(order.distanceKm).toFixed(1)} km from store
                          </p>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1.5 text-xs">
                        <p className="font-semibold text-slate-800">
                          {order.items?.length || 0} item{order.items?.length === 1 ? "" : "s"} ·{" "}
                          {isCodPayment(order.paymentMethod)
                            ? `COD ${formatRupee(order.amountToCollect || order.orderTotal)}`
                            : "Paid online"}
                        </p>
                        <p className="line-clamp-3 text-slate-600">
                          {(order.items || []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                        </p>
                        {order.forwardedAt && (
                          <p className="text-[11px] text-slate-500">
                            Forwarded {formatTime(order.forwardedAt)}
                            {order.forwardedByName ? ` by ${order.forwardedByName}` : ""}
                          </p>
                        )}
                        {order.preOrderNote && (
                          <p className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900">
                            PM note: {order.preOrderNote}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-stretch gap-2 lg:items-end">
                        {order.status === "preorder_hold" && (
                          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-[11px] font-semibold text-indigo-800">
                            Waiting for the Product Manager to prepare & forward this order.
                          </p>
                        )}

                        {order.status === "offered" && (
                          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
                            Offer sent to {order.offeredRider?.name || "rider"}
                            {offerMsLeft > 0 ? ` · ${Math.ceil(offerMsLeft / 1000)}s` : " · waiting…"}
                          </p>
                        )}

                        {canAssign && (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={selectedRider[oid] || ""}
                              onChange={(e) => setSelectedRider((prev) => ({ ...prev, [oid]: e.target.value }))}
                              className="min-w-[160px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none"
                            >
                              <option value="">
                                {assignableRiders.length ? "Choose rider…" : "No free riders online"}
                              </option>
                              {assignableRiders.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name || r.phone} · {r.vehicleType || "rider"}
                                </option>
                              ))}
                              {unavailableRiders.length > 0 && (
                                <optgroup label="Unavailable">
                                  {unavailableRiders.map((r) => (
                                    <option key={r.id} value={r.id} disabled>
                                      {r.name || r.phone} · {r.activeOrderId ? "on delivery" : r.status || "offline"}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                            <button
                              type="button"
                              disabled={!selectedRider[oid] || busyKey === `assign-${oid}`}
                              onClick={() => onAssign(order)}
                              className={actionBtnPrimary}
                            >
                              {busyKey === `assign-${oid}`
                                ? "Sending…"
                                : order.status === "offered"
                                  ? "Re-assign"
                                  : "Assign"}
                            </button>
                          </div>
                        )}

                        {order.assignedRider && (
                          <p className="text-[11px] font-bold text-teal-800">
                            Rider: {order.assignedRider.name}{" "}
                            <span className="font-normal text-slate-500">{order.assignedRider.phone}</span>
                          </p>
                        )}
                        {order.pickupProofStatus === "pending" && order.pickupProofImageUrl && (
                          <div className="flex items-center gap-2">
                            <img
                              src={order.pickupProofImageUrl}
                              alt="Item proof"
                              className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                            />
                            <button
                              type="button"
                              disabled={busyKey === `proof-${oid}`}
                              onClick={() => onApproveProof(order)}
                              className={actionBtnPrimary}
                            >
                              {busyKey === `proof-${oid}` ? "Approving…" : "✓ Approve item proof"}
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {showQr && (
                            <button
                              type="button"
                              onClick={() => openPickupQr(oid)}
                              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                            >
                              Show Pickup QR
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/orders/${oid}`, { state: { order } })}
                            className={actionBtnOutline}
                          >
                            View Detail
                          </button>
                          {!isClosed && (
                            <button
                              type="button"
                              disabled={busyKey === `cancel-${oid}`}
                              onClick={() => onCancel(order)}
                              className={actionBtnDanger}
                            >
                              {busyKey === `cancel-${oid}` ? "Cancelling…" : "Cancel"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <PickupQrModal
        isOpen={Boolean(pickupQr.orderId)}
        onClose={() => setPickupQr({ orderId: null, loading: false, error: "", data: null })}
        loading={pickupQr.loading}
        error={pickupQr.error}
        orderNumber={pickupQr.data?.orderNumber}
        driverName={pickupQr.data?.driverName}
        pickupQrPayload={pickupQr.data?.pickupQrPayload}
      />
    </PageShell>
  );
}
