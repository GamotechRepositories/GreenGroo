import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { getOrders } from "../api/farmerApi";
import { ORDER_STATUS } from "../utils/constants";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_SELECT } from "../utils/excelStyles";

function OrdersPage() {
  const { search } = useOutletContext() || {};
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setOrders(await getOrders({ status, q: search || "" }));
      } catch (err) {
        toast.error(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, search]);

  const columns = [
    { key: "id", header: "Order ID" },
    { key: "customer", header: "Customer", render: (row) => row.customer?.name },
    { key: "product", header: "Product", render: (row) => row.products?.[0]?.name || "—" },
    { key: "quantity", header: "Qty" },
    { key: "amount", header: "Amount", render: (row) => `₹${row.amount}` },
    { key: "deliveryType", header: "Delivery Type" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "orderDate",
      header: "Order Date",
      render: (row) => new Date(row.orderDate).toLocaleDateString("en-IN"),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <Link to={`/farmer/orders/${row.id}`} className="font-semibold text-[#217346]">
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Orders</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>Manage and fulfill customer orders.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={EXCEL_SELECT}>
          <option value="">All statuses</option>
          {ORDER_STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" description="New orders will appear here." />
      ) : (
        <DataTable columns={columns} rows={orders} />
      )}
    </div>
  );
}

export default OrdersPage;
