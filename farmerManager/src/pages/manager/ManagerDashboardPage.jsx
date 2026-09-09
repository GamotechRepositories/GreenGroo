import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getManagerDashboard, getManagerAllHarvestOrders } from "../../api/farmerApi";
import { usePolling } from "../../hooks/usePolling";
import StatusBadge from "../../components/ui/StatusBadge";
import CopyId from "../../components/ui/CopyId";
import { managerOrderBucket } from "../../utils/orderDisplay";
import ManagerDashboardCharts from "../../components/manager/ManagerDashboardCharts";
import { EXCEL_PANEL, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB } from "../../utils/excelStyles";

function StatCard({ label, value, sub, to, color = "text-[#1F2937]" }) {
  const inner = (
    <div className={`${EXCEL_PANEL} h-full min-w-0 p-3 sm:p-5`}>
      <p className="truncate text-[11px] leading-tight text-[#6B7280] sm:text-xs">{label}</p>
      <p className={`mt-1 truncate text-[17px] font-bold leading-tight sm:text-2xl ${color}`}>{value ?? "—"}</p>
      {sub ? <p className="mt-1 text-[10px] text-[#6B7280]">{sub}</p> : null}
    </div>
  );
  return to ? <Link to={to} className="min-w-0">{inner}</Link> : inner;
}

function orderWhen(order) {
  return new Date(order?.createdAt || order?.orderDate || order?.date || 0).getTime() || 0;
}

function latestTen(orders = []) {
  return [...orders].sort((a, b) => orderWhen(b) - orderWhen(a)).slice(0, 10);
}

function orderHref(order) {
  const id = order?.orderId || order?.id;
  return id ? `/manager/orders/detail/${encodeURIComponent(id)}` : "/manager/orders";
}

function RecentOrderCard({ order }) {
  const id = order.orderId || order.id;
  const qty = order.totalQuantity ?? order.orderedQuantity ?? 0;
  const unit = order.unit || "Kg";
  const amount = Number(order.totalAmount || order.orderValue || order.amount || 0);
  const when = order.orderDate || order.date || order.createdAt;
  return (
    <Link to={orderHref(order)} className="block px-3 py-3 active:bg-slate-50 sm:px-4">
      <div className="flex items-start justify-between gap-2">
        <CopyId value={id} textClassName="font-mono text-[11px] font-semibold text-[#217346]" breakAll />
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1.5 truncate text-[13px] font-semibold text-slate-900">
        {order.farmerName || "—"}
        <span className="font-medium text-[#6B7280]">
          {" · "}
          {order.productName || order.products?.[0]?.name || "—"}
        </span>
      </p>
      <p className="mt-0.5 text-[11px] text-[#6B7280]">
        {qty} {unit}
        {" · "}
        <span className="font-semibold text-slate-800">₹{amount.toLocaleString("en-IN")}</span>
        {when ? ` · ${new Date(when).toLocaleDateString("en-IN")}` : ""}
      </p>
    </Link>
  );
}

function LowStockCard({ item }) {
  return (
    <div className="px-3 py-3 sm:px-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-semibold text-slate-900">{item.productName}</p>
        <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Low Stock</span>
      </div>
      <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">{item.farmerName}</p>
      <p className="mt-1 text-[12px] font-semibold text-[#DC2626]">{item.currentStock} Kg</p>
      <p className="text-[11px] text-[#6B7280]">{item.grades?.map((g) => g.label).join(", ") || "All"}</p>
    </div>
  );
}

export default function ManagerDashboardPage() {
  const manager = useSelector((s) => s.farmer.farmer);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orderCounts, setOrderCounts] = useState({ pending: 0, accepted: 0, rejected: 0 });
  const [harvestOrders, setHarvestOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  usePolling(() => {
    Promise.all([
      getManagerDashboard(),
      getManagerAllHarvestOrders().catch(() => ({ orders: [] })),
    ])
      .then(([dash, harvest]) => {
        setStats(dash);
        const orders = Array.isArray(harvest?.orders) ? harvest.orders : [];
        setHarvestOrders(orders);
        const counts = { pending: 0, accepted: 0, rejected: 0 };
        (Array.isArray(harvest?.orders) ? harvest.orders : []).forEach((o) => {
          const bucket = managerOrderBucket(o.status);
          if (counts[bucket] != null) counts[bucket] += 1;
        });
        setOrderCounts(counts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [], 5000);

  const recent = latestTen(harvestOrders.length ? harvestOrders : stats?.recentOrders || []);
  const lowStock = stats?.lowStock || [];

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#217346] sm:text-xs">Farmer Manager</p>
        <h1 className={`${EXCEL_PAGE_TITLE} truncate`}>{manager?.name || "Manager"}</h1>
        <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
          Welcome back! Here's an overview of your assigned farmers.
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-[#6B7280]">Loading dashboard…</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          <StatCard label="Total Farmers" value={stats?.totalFarmers} to="/manager/farmers" />
          <StatCard label="Active Farmers" value={stats?.activeFarmers} color="text-[#217346]" to="/manager/farmers" />
          <StatCard label="Total Products" value={stats?.totalProducts} to="/manager/products" />
          <StatCard label="Pending Approvals" value={stats?.pendingProductApprovals} color="text-amber-600" to="/manager/products" />
          <StatCard label="Total Inventory" value={`${stats?.totalInventory ?? 0} Kg`} to="/manager/inventory" />
          <StatCard label="Total Orders" value={stats?.totalOrders} to="/manager/orders" />
          <StatCard label="Pending Orders" value={stats?.pendingOrders} color="text-amber-600" to="/manager/orders" />
          <StatCard label="Total Earnings" value={`₹${(stats?.totalEarnings ?? 0).toLocaleString("en-IN")}`} to="/manager/earnings" color="text-[#217346]" />
          <StatCard label="Pending Earnings" value={`₹${(stats?.pendingEarnings ?? 0).toLocaleString("en-IN")}`} color="text-amber-600" to="/manager/earnings" />
        </div>
      )}

      {!loading ? (
        <ManagerDashboardCharts
          orders={harvestOrders}
          counts={orderCounts}
          onStatus={(key) => {
            navigate(key === "all" ? "/manager/orders" : `/manager/orders?status=${key}`);
          }}
        />
      ) : null}

      <div className={EXCEL_PANEL}>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 sm:px-4">
          <p className="text-sm font-semibold text-slate-900">Recent Orders</p>
          <span className="text-[11px] font-medium text-[#6B7280]">Latest 10</span>
          <Link to="/manager/orders" className="ml-auto text-[11px] font-semibold text-[#217346] sm:text-xs">
            View all
          </Link>
        </div>

        <div className="divide-y divide-slate-100 lg:hidden">
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#6B7280]">No recent orders</p>
          ) : (
            recent.map((order) => <RecentOrderCard key={order.id || order.orderId} order={order} />)
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                {["Order ID", "Farmer", "Product", "Qty", "Amount", "Status", "Date"].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-[#6B7280]">No recent orders</td>
                </tr>
              ) : (
                recent.map((order) => (
                  <tr key={order.id || order.orderId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <CopyId value={order.orderId || order.id} textClassName="font-mono text-[11px] text-[#217346]" />
                    </td>
                    <td className="px-3 py-2">{order.farmerName || "—"}</td>
                    <td className="px-3 py-2">{order.productName || order.products?.[0]?.name || "—"}</td>
                    <td className="px-3 py-2">{order.totalQuantity ?? order.orderedQuantity ?? 0} {order.unit || "Kg"}</td>
                    <td className="px-3 py-2 font-semibold">₹{Number(order.totalAmount || order.orderValue || order.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-2 text-[#6B7280]">
                      {order.orderDate || order.date || order.createdAt
                        ? new Date(order.orderDate || order.date || order.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {lowStock.length > 0 ? (
        <div className={EXCEL_PANEL}>
          <div className="border-b border-slate-100 px-3 py-3 sm:px-4">
            <p className="text-sm font-semibold text-red-600">⚠ Low Stock Alerts</p>
          </div>
          <div className="divide-y divide-slate-100 lg:hidden">
            {lowStock.map((item, i) => (
              <LowStockCard key={item.id || `${item.farmerName}-${item.productName}-${i}`} item={item} />
            ))}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {["Farmer", "Product", "Grade", "Current Stock", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2">{item.farmerName}</td>
                    <td className="px-3 py-2">{item.productName}</td>
                    <td className="px-3 py-2">{item.grades?.map((g) => g.label).join(", ") || "All"}</td>
                    <td className="px-3 py-2 font-semibold text-[#DC2626]">{item.currentStock} Kg</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
