import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getDashboardStats } from "../api/farmerApi";
import StatCard from "../components/ui/StatCard";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setStats(await getDashboardStats());
      } catch (err) {
        toast.error(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState rows={6} />;

  const orderColumns = [
    { key: "id", header: "Order ID" },
    {
      key: "product",
      header: "Product",
      render: (row) => row.products?.[0]?.name || "—",
    },
    { key: "quantity", header: "Qty" },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "date",
      header: "Date",
      render: (row) => new Date(row.orderDate).toLocaleDateString("en-IN"),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <Link to={`/farmer/orders/${row.id}`} className="font-semibold text-[#2E7D32] hover:underline">
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Overview of your farm marketplace activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Products" value={stats.totalProducts} />
        <StatCard title="Available Stock" value={stats.availableStock} />
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} />
        <StatCard title="Total Earnings" value={formatCurrency(stats.totalEarnings)} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Recent Orders</h2>
        <DataTable columns={orderColumns} rows={stats.recentOrders} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Low Stock Products</h2>
          <ul className="mt-3 space-y-2">
            {stats.lowStockProducts.length === 0 ? (
              <li className="text-sm text-[#6B7280]">All stocks look healthy.</li>
            ) : (
              stats.lowStockProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-[#F7F2E8] px-3 py-2 text-sm"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="font-semibold text-amber-700">
                    {p.stock} {p.unit}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Recent Earnings</h2>
          <ul className="mt-3 space-y-2">
            {stats.recentEarnings.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-xl bg-[#F7F2E8] px-3 py-2 text-sm"
              >
                <span>
                  {t.orderId} · <StatusBadge status={t.status} />
                </span>
                <span className="font-semibold text-[#2E7D32]">
                  {formatCurrency(t.netEarnings)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
