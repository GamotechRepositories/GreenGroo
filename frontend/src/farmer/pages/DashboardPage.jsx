import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getDashboardStats } from "../api/farmerApi";
import StatCard from "../components/ui/StatCard";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import {
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_ROW,
} from "../utils/excelStyles";

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
        <Link to={`/farmer/orders/${row.id}`} className="font-semibold text-[#217346] hover:underline">
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Dashboard</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>Overview of your farm marketplace activity.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Products" value={stats.totalProducts} />
        <StatCard title="Available Stock" value={stats.availableStock} />
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} />
        <StatCard title="Total Earnings" value={formatCurrency(stats.totalEarnings)} />
      </div>

      <section className="space-y-2">
        <h2 className={EXCEL_PAGE_TITLE}>Recent Orders</h2>
        <DataTable columns={orderColumns} rows={stats.recentOrders} />
      </section>

      <div className="grid gap-2 lg:grid-cols-2">
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Low Stock Products</h2>
          <ul className="divide-y divide-[#D4D4D4]">
            {stats.lowStockProducts.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[#6B7280]">All stocks look healthy.</li>
            ) : (
              stats.lowStockProducts.map((p) => (
                <li key={p.id} className={`${EXCEL_ROW} flex items-center justify-between border-0 border-b`}>
                  <span className="font-medium">{p.name}</span>
                  <span className="font-semibold text-amber-700">
                    {p.stock} {p.unit}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Recent Earnings</h2>
          <ul className="divide-y divide-[#D4D4D4]">
            {stats.recentEarnings.map((t) => (
              <li key={t.id} className={`${EXCEL_ROW} flex items-center justify-between border-0 border-b`}>
                <span>
                  {t.orderId} · <StatusBadge status={t.status} />
                </span>
                <span className="font-semibold text-[#217346]">{formatCurrency(t.netEarnings)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
