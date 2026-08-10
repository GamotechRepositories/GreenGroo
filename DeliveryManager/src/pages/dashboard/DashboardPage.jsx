import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";

export default function DashboardPage() {
  const { manager } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await managerApi.dashboard();
        if (alive) setSummary(res.data.summary);
      } catch (err) {
        if (alive) {
          setError(err.response?.data?.message || "Failed to load dashboard");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const cards = [
    {
      label: "Incoming orders",
      value: summary?.incomingOrders ?? "—",
      to: "/orders",
      tone: "text-gray-900",
    },
    {
      label: "Stock SKUs",
      value: summary?.inventorySkus ?? "—",
      to: "/stock",
      tone: "text-gray-900",
    },
    {
      label: "Low stock",
      value: summary?.lowStockItems ?? "—",
      to: "/stock",
      tone: "text-orange-600",
    },
    {
      label: "Drivers online",
      value: `${summary?.ridersOnline ?? 0}/${summary?.ridersTotal ?? 0}`,
      to: "/drivers",
      tone: "text-gray-900",
    },
    {
      label: "Pending verification",
      value: summary?.pendingDrivers ?? "—",
      to: "/drivers/pending",
      tone: "text-blue-700",
    },
  ];

  return (
    <PageShell
      title={`Welcome, ${manager?.name || "Manager"}`}
      subtitle={`${manager?.storeName || "Store"} · ${manager?.area}, ${manager?.city}`}
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Store overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          {manager?.storeName} · {manager?.area}, {manager?.city}, {manager?.state}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="rounded-xl bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-green-primary/30"
            >
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold ${card.tone}`}>{card.value}</p>
              <p className="mt-2 text-xs font-medium text-green-primary">Open →</p>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
