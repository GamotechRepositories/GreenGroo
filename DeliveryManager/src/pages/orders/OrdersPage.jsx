import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";

export default function OrdersPage() {
  const { manager } = useAuth();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [ord, rid] = await Promise.all([
        managerApi.orders(),
        managerApi.riders(),
      ]);
      setOrders(ord.data.orders || []);
      setRiders(rid.data.riders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
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

  const onAssign = async (orderId) => {
    const riderId = selectedRider[orderId];
    if (!riderId) {
      showToast("Select a rider first");
      return;
    }
    const key = `assign-${orderId}`;
    setBusyKey(key);
    try {
      const res = await managerApi.assignOrder(orderId, riderId);
      showToast(res.data.message || "Order assigned");
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Assign failed");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <PageShell
      title="Incoming Orders"
      subtitle={`${manager?.storeName || "Store"} · ${manager?.area}`}
    >
      {toast && (
        <div className="rounded-xl border border-green-primary/20 bg-green-light px-4 py-3 text-sm font-medium text-green-dark">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">
          Incoming ({orders.length})
        </h2>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          No incoming orders for your area right now.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const allOk = order.items.every(
              (i) => i.stockStatus === "available" || i.customerInformed
            );
            return (
              <div key={order.id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        #{order.orderNumber}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          order.status === "stock_issue"
                            ? "bg-orange-50 text-orange-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="font-medium text-gray-800">
                        {order.customerName}
                      </span>
                      {" · "}
                      {order.customerAddress}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedRider[order.id] || ""}
                      onChange={(e) =>
                        setSelectedRider((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">Select rider</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name || r.phone} ({r.status})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!allOk || busyKey === `assign-${order.id}`}
                      onClick={() => onAssign(order.id)}
                      className="rounded-lg bg-green-dark px-4 py-2 text-sm font-semibold text-white hover:bg-green-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyKey === `assign-${order.id}` ? "Assigning…" : "Assign"}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                        <th className="pb-2 font-semibold">Item</th>
                        <th className="pb-2 font-semibold">Qty</th>
                        <th className="pb-2 font-semibold">Stock check</th>
                        <th className="pb-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => {
                        const available = item.stockStatus === "available";
                        return (
                          <tr key={item.id} className="border-b border-gray-50">
                            <td className="py-3">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-400">{item.sku}</p>
                            </td>
                            <td className="py-3 text-gray-700">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3">
                              {available ? (
                                <span className="rounded-full bg-green-light px-2.5 py-1 text-xs font-semibold text-green-primary">
                                  ✅ Available ({item.availableStock})
                                </span>
                              ) : (
                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                                  ❌ Out of Stock ({item.availableStock ?? 0})
                                </span>
                              )}
                            </td>
                            <td className="py-3">
                              {!available && (
                                <button
                                  type="button"
                                  disabled={
                                    item.customerInformed ||
                                    busyKey === `inform-${order.id}-${item.id}`
                                  }
                                  onClick={() => onInform(order.id, item.id)}
                                  className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                                >
                                  {item.customerInformed
                                    ? "Customer informed"
                                    : busyKey === `inform-${order.id}-${item.id}`
                                      ? "Sending…"
                                      : "Inform Customer"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
