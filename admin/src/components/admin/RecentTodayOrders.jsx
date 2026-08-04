import { Link } from "react-router-dom";
import { getAddressFullName } from "../../utils/addressDisplay";
import { getOrderNumber } from "../../utils/orderNumber";
import { cardClass } from "./adminStyles";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RecentTodayOrders({ orders, loading }) {
  return (
    <div className={cardClass}>
      <h3 className="mb-4 text-base font-semibold text-neutral-900">
        Recent Today&apos;s Placed Orders
      </h3>

      {loading ? (
        <p className="py-6 text-center text-sm text-text-secondary">Loading orders...</p>
      ) : !orders?.length ? (
        <p className="py-8 text-center text-sm text-neutral-500">No orders placed today.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                <th className="pb-3 pr-4">Order ID</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-3 pr-4">
                    <Link
                      to={`/orders/${order._id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      #{getOrderNumber(order)}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-neutral-700">
                    {order.user?.name || getAddressFullName(order.deliveryAddress) || "—"}
                  </td>
                  <td className="py-3 pr-4 font-medium text-neutral-900">
                    {formatPrice(order.total)}
                  </td>
                  <td className="py-3 pr-4 capitalize text-neutral-600">{order.status}</td>
                  <td className="py-3 text-neutral-500">{formatTime(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentTodayOrders;
