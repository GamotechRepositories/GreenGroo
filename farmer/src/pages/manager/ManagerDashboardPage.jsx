import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { getManagerDashboard } from "../../api/farmerApi";
import { EXCEL_PANEL, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB } from "../../utils/excelStyles";

const STATUS_COLORS = {
  New: "bg-blue-100 text-blue-700",
  Confirmed: "bg-indigo-100 text-indigo-700",
  Processing: "bg-yellow-100 text-yellow-700",
  "Ready for Pickup": "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Delivered: "bg-emerald-100 text-emerald-700",
};

function StatCard({ label, value, sub, to, color = "text-[#1F2937]" }) {
  const inner = (
    <div className={`${EXCEL_PANEL} p-4`}>
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value ?? "—"}</p>
      {sub && <p className="mt-1 text-[10px] text-[#6B7280]">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function ManagerDashboardPage() {
  const manager = useSelector((s) => s.farmer.farmer);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getManagerDashboard()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#217346]">Farmer Manager</p>
        <h1 className={EXCEL_PAGE_TITLE}>{manager?.name || "Manager"}</h1>
        <p className={EXCEL_PAGE_SUB}>
          Welcome back! Here's an overview of your assigned farmers.
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <p className="text-xs text-[#6B7280]">Loading dashboard…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Farmers" value={stats?.totalFarmers} to="/farmer/manager/farmers" />
          <StatCard label="Active Farmers" value={stats?.activeFarmers} color="text-[#217346]" to="/farmer/manager/farmers" />
          <StatCard label="Total Products" value={stats?.totalProducts} to="/farmer/manager/products" />
          <StatCard label="Total Inventory" value={`${stats?.totalInventory ?? 0} Kg`} to="/farmer/manager/inventory" />
          <StatCard label="Total Orders" value={stats?.totalOrders} to="/farmer/manager/orders" />
          <StatCard label="Pending Orders" value={stats?.pendingOrders} color="text-amber-600" to="/farmer/manager/orders" />
          <StatCard label="Total Earnings" value={`₹${(stats?.totalEarnings ?? 0).toLocaleString("en-IN")}`} to="/farmer/manager/earnings" color="text-[#217346]" />
          <StatCard label="Pending Earnings" value={`₹${(stats?.pendingEarnings ?? 0).toLocaleString("en-IN")}`} color="text-amber-600" to="/farmer/manager/earnings" />
        </div>
      )}

      {/* Recent Orders */}
      <div className={EXCEL_PANEL}>
        <div className="border-b border-[#D4D4D4] px-4 py-2.5">
          <p className="text-xs font-bold text-[#1F2937]">Recent Orders</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F2F2F2] text-left">
                {["Order ID", "Farmer", "Product", "Qty", "Amount", "Status", "Date"].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats?.recentOrders || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-[#6B7280]">No recent orders</td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2 font-mono text-[#217346]">{order.id}</td>
                    <td className="px-3 py-2">{order.farmerName || "—"}</td>
                    <td className="px-3 py-2">{order.products?.[0]?.name || "—"}</td>
                    <td className="px-3 py-2">{order.totalQuantity} Kg</td>
                    <td className="px-3 py-2 font-semibold">₹{(order.totalAmount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#6B7280]">
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {(stats?.lowStock || []).length > 0 && (
        <div className={EXCEL_PANEL}>
          <div className="border-b border-[#D4D4D4] px-4 py-2.5">
            <p className="text-xs font-bold text-[#DC2626]">⚠ Low Stock Alerts</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F2F2F2] text-left">
                  {["Farmer", "Product", "Grade", "Current Stock", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.lowStock.map((item, i) => (
                  <tr key={i} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2">{item.farmerName}</td>
                    <td className="px-3 py-2">{item.productName}</td>
                    <td className="px-3 py-2">
                      {item.grades?.map((g) => g.label).join(", ") || "All"}
                    </td>
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
      )}
    </div>
  );
}
