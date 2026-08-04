import { Link, useNavigate } from "react-router-dom";
import { getAddressFullName } from "../../../utils/addressDisplay";
import { getOrderNumber } from "../../../utils/orderNumber";
import { cardClass } from "../adminStyles";
import { formatCurrency } from "./dashboardUtils";

const STATUS_STYLES = {
  attempted: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  return: "bg-amber-100 text-amber-800",
  confirm: "bg-amber-100 text-amber-800",
  processing: "bg-amber-100 text-amber-800",
  shipping: "bg-blue-100 text-blue-800",
};

function DashboardRecentOrders({ orders = [], loading, viewAllTo = "/orders" }) {
  const navigate = useNavigate();

  return (
    <div className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-neutral-900">Today's Orders</h3>
        <Link to={viewAllTo} className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-neutral-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">No orders today.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                <th className="pb-3 pr-4">Order ID</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                >
                  <td className="py-3 pr-4 font-semibold text-primary">
                    #{getOrderNumber(order)}
                  </td>
                  <td className="py-3 pr-4 text-neutral-700">
                    {order.user?.name || getAddressFullName(order.deliveryAddress) || "—"}
                  </td>
                  <td className="py-3 pr-4 font-medium text-neutral-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[order.status] || "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DashboardRecentOrders;
