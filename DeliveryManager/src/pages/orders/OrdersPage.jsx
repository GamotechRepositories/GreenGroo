import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import StoreQrModal from "../../components/StoreQrModal";
import { Icon } from "../../components/ui/Icon";

const STATUS_BADGE = {
  order_received: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      NEW ORDER
    </span>
  ),
  incoming: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      NEW ORDER
    </span>
  ),
  packed: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">
      📦 PACKED
    </span>
  ),
  offered: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-300 animate-pulse">
      ⏱ OFFERING RIDER
    </span>
  ),
  assigned: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 border border-teal-200">
      🛵 ASSIGNED
    </span>
  ),
  out_for_delivery: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-300">
      ⚡ OUT FOR DELIVERY
    </span>
  ),
  delivered: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
      ✅ DELIVERED
    </span>
  ),
  stock_issue: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
      ⚠️ STOCK ISSUE
    </span>
  ),
};

const STATUS_TABS = [
  { id: "active", label: "Active" },
  { id: "incoming", label: "New / Pack" },
  { id: "packed", label: "Packed" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "all", label: "All" },
];

function matchesTab(order, tab) {
  const s = order.status;
  if (tab === "all") return true;
  if (tab === "active") return ["incoming", "order_received", "stock_issue", "packed", "offered", "assigned", "out_for_delivery"].includes(s);
  if (tab === "incoming") return ["incoming", "order_received", "stock_issue"].includes(s);
  if (tab === "packed") return ["packed", "offered"].includes(s);
  if (tab === "out_for_delivery") return ["assigned", "out_for_delivery"].includes(s);
  if (tab === "delivered") return s === "delivered";
  return true;
}

export default function OrdersPage() {
  const { manager } = useAuth();
  const [orders, setOrders] = useState([]);
  const [onlineRiders, setOnlineRiders] = useState([]);
  const [darkStoreQr, setDarkStoreQr] = useState("");
  const [selectedRider, setSelectedRider] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const load = useCallback(async () => {
    try {
      const [ord, rid] = await Promise.all([
        managerApi.orders(),
        managerApi.riders(),
      ]);
      setOrders(ord.data.orders || []);
      // Only show online riders for dispatch
      setOnlineRiders((rid.data.riders || []).filter((r) => r.status === "online"));
      setDarkStoreQr(ord.data.darkStoreQrCode || `DARKSTORE_${manager?.id || manager?._id || ""}`);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [manager]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const onPackOrder = async (orderId) => {
    const key = `pack-${orderId}`;
    setBusyKey(key);
    try {
      const res = await managerApi.packOrder(orderId);
      showToast(res.data.message || "Order packed — auto-dispatch initiated!");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to pack order");
    } finally {
      setBusyKey("");
    }
  };

  const onInform = async (orderId, itemId) => {
    const key = `inform-${orderId}-${itemId}`;
    setBusyKey(key);
    try {
      const res = await managerApi.informCustomer(orderId, itemId);
      showToast(res.data.message || "Customer informed");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to inform customer");
    } finally {
      setBusyKey("");
    }
  };

  const onManualAssign = async (orderId) => {
    const riderId = selectedRider[orderId];
    if (!riderId) { showToast("Select a rider first"); return; }
    const key = `assign-${orderId}`;
    setBusyKey(key);
    try {
      const res = await managerApi.assignOrder(orderId, riderId);
      showToast(res.data.message || "Rider assigned");
      setSelectedRider((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Assignment failed");
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
      subtitle={`${manager?.storeName || "Dark Store"} · ${manager?.area}, ${manager?.city}`}
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
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              QR Code
            </button>
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

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
            <Icon name="orders" size="xl" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Orders Found</h3>
          <p className="mt-1 text-xs text-slate-400">
            {searchQuery ? "No orders match your search." : "No orders in this category right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const oid = order.id || order._id;
            const isInitial = ["incoming", "order_received", "stock_issue"].includes(order.status);
            const isPacked = order.status === "packed";
            const isOffered = order.status === "offered";
            const allAvailable = (order.items || []).every(
              (i) => i.stockStatus === "available" || i.customerInformed
            );

            return (
              <div
                key={oid}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">#{order.orderNumber}</h3>
                      {STATUS_BADGE[order.status] || (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {(order.status || "").toUpperCase().replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
                      <span className="font-bold text-slate-900">👤 {order.customerName || "Customer"}</span>
                      <span className="text-slate-500">📞 {order.customerPhone || "N/A"}</span>
                      <span className="text-slate-400 truncate max-w-xs">📍 {order.customerAddress}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isInitial && (
                      <button
                        type="button"
                        disabled={!allAvailable || busyKey === `pack-${oid}`}
                        onClick={() => onPackOrder(oid)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition active:scale-95"
                      >
                        {busyKey === `pack-${oid}` ? "Packing…" : "📦 Mark Packed"}
                      </button>
                    )}

                    {isOffered && (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 border border-amber-200 text-xs font-bold text-amber-800">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                        Offering to rider...
                      </div>
                    )}

                    {/* Manual assign: show when packed or in initial state */}
                    {(isInitial || isPacked) && (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedRider[oid] || ""}
                          onChange={(e) =>
                            setSelectedRider((prev) => ({ ...prev, [oid]: e.target.value }))
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
                        >
                          <option value="">Manual assign…</option>
                          {onlineRiders.map((r) => (
                            <option key={r.id || r._id} value={r.id || r._id}>
                              {r.name || r.phone}
                            </option>
                          ))}
                          {onlineRiders.length === 0 && (
                            <option disabled>No riders online</option>
                          )}
                        </select>
                        <button
                          type="button"
                          disabled={!selectedRider[oid] || busyKey === `assign-${oid}`}
                          onClick={() => onManualAssign(oid)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-2">Item</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Stock</th>
                        {isInitial && <th className="pb-2 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(order.items || []).map((item) => {
                        const inStock = item.stockStatus === "available";
                        return (
                          <tr key={item.id || item._id}>
                            <td className="py-2">
                              <p className="font-semibold text-slate-900">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                            </td>
                            <td className="py-2 font-semibold text-slate-700">
                              {item.quantity} {item.unit || "pcs"}
                            </td>
                            <td className="py-2 text-slate-600">₹{item.price}</td>
                            <td className="py-2">
                              {inStock ? (
                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  ✅ In Stock
                                </span>
                              ) : (
                                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                  ❌ Out of Stock
                                </span>
                              )}
                            </td>
                            {isInitial && (
                              <td className="py-2 text-right">
                                {!inStock && (
                                  <button
                                    type="button"
                                    disabled={item.customerInformed || busyKey === `inform-${oid}-${item.id || item._id}`}
                                    onClick={() => onInform(oid, item.id || item._id)}
                                    className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-60 transition"
                                  >
                                    {item.customerInformed ? "Informed ✅" : "Inform Customer"}
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Assigned Rider Info (if assigned) */}
                {order.assignedRider && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
                    <span>🛵</span>
                    <span className="font-semibold">
                      {order.assignedRider.name || order.assignedRider.phone}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span>{order.assignedRider.phone}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <StoreQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        storeName={manager?.storeName}
        area={manager?.area}
        qrCode={darkStoreQr}
      />
    </PageShell>
  );
}
