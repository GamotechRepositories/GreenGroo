import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import { Icon } from "../../components/ui/Icon";

export default function AlertsPage() {
  const { manager } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadAlerts = useCallback(async () => {
    try {
      const params = filter === "unread" ? { unreadOnly: "true" } : {};
      const res = await managerApi.getAlerts(params);
      setAlerts(res.data?.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load store alerts");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const onMarkRead = async (alertId) => {
    try {
      await managerApi.markAlertRead(alertId);
      await loadAlerts();
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  return (
    <PageShell
      title="Store Operational Alerts"
      subtitle={`Live alert notifications & exception handling for ${manager?.storeName || "Dark Store"}`}
    >
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Alert Notifications ({alerts.length})</h2>
            <p className="text-xs text-slate-500">System generated alerts for stock delays, rider updates, and order exceptions</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  filter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Alerts
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  filter === "unread" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Unread Only
              </button>
            </div>

            <button
              type="button"
              onClick={loadAlerts}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading alerts feed…</p>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-sm font-bold text-slate-700">No alerts found</p>
            <p className="text-xs text-slate-400 mt-1">
              Your store hub is running cleanly. New stock alerts or delayed delivery flags will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((item) => (
              <div
                key={item._id}
                className={`rounded-xl border p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.isRead
                    ? "border-slate-100 bg-slate-50/50"
                    : "border-rose-200 bg-rose-50/40 shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
                    item.isRead ? "bg-slate-200 text-slate-600" : "bg-rose-100 text-rose-700"
                  }`}>
                    <Icon name="bell" size="sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[11px] uppercase tracking-wider text-rose-800">
                        {item.type || "SYSTEM ALERT"}
                      </span>
                      {!item.isRead && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                          New
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900 leading-snug">
                      {item.message}
                    </p>
                    {item.relatedOrderId && (
                      <p className="mt-1 text-xs text-slate-500">
                        Related Order Status: <span className="font-semibold text-slate-700">{item.relatedOrderId.status || "Active"}</span>
                      </p>
                    )}
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(item._id)}
                    className="self-start sm:self-center shrink-0 rounded-xl border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
                  >
                    Mark as Read ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}