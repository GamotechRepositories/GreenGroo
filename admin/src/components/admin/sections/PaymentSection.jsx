import { useCallback, useEffect, useState } from "react";
import { getAdminRazorpayTransactions } from "../../../api/api";
import { useAuth } from "../../../context/AuthContext";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
} from "../adminStyles";
import AdminOrderFilters from "./AdminOrderFilters";
import PaymentDetailModal from "./PaymentDetailModal";
import {
  downloadRazorpayPaymentsCsv,
  formatDate,
  formatPrice,
  getCustomerName,
  getCustomerPhone,
  getOrderDisplayId,
  getRazorpayPaidAt,
  getRazorpayPaymentId,
  getRazorpayPaymentTypeLabel,
  getRazorpayTransactionAmount,
  normalizeAdminSearchQuery,
} from "./adminOrderUtils";

function getErrorMessage(err, fallback) {
  return err.response?.data?.message || err.message || fallback;
}

function PaymentSection() {
  const { adminUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ADMIN_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, orderStatus, searchQuery]);

  const fetchData = useCallback(async () => {
    if (adminUser?.role !== "admin") return;

    try {
      setLoading(true);
      setError("");
      const params = { page, limit: ADMIN_PAGE_SIZE };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (orderStatus !== "all") params.status = orderStatus;
      if (searchQuery.trim()) params.search = normalizeAdminSearchQuery(searchQuery);

      const { data } = await getAdminRazorpayTransactions(params);
      const loadedTransactions = data.data || [];
      setTransactions(loadedTransactions);
      setPagination(
        data.pagination || {
          page,
          limit: ADMIN_PAGE_SIZE,
          total: loadedTransactions.length,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load Razorpay payments"));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [adminUser, startDate, endDate, orderStatus, searchQuery, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownload = async () => {
    try {
      const params = { limit: 10000 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (orderStatus !== "all") params.status = orderStatus;
      if (searchQuery.trim()) params.search = normalizeAdminSearchQuery(searchQuery);
      const { data } = await getAdminRazorpayTransactions(params);
      downloadRazorpayPaymentsCsv(data.data || [], "razorpay-payments.csv");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to download Razorpay payments"));
    }
  };

  return (
    <div className="min-w-0">
      <AdminAlert error={error} onClear={() => setError("")} />

      <p className="mb-1 text-sm font-medium text-neutral-700">
        {pagination.total} successful Razorpay transaction{pagination.total === 1 ? "" : "s"}
      </p>
      <p className="mb-4 text-xs text-neutral-500">
        Only verified Razorpay payments are shown here with the actual amount charged.
      </p>

      <AdminOrderFilters
        startDate={startDate}
        endDate={endDate}
        orderStatus={orderStatus}
        paymentStatus="all"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by order ID, Razorpay ID, product, or customer..."
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onOrderStatusChange={setOrderStatus}
        onPaymentStatusChange={() => {}}
        onDownload={handleDownload}
        showPaymentStatus={false}
      />

      {loading ? (
        <p className="mt-4 text-text-secondary">Loading Razorpay payments...</p>
      ) : transactions.length === 0 ? (
        <p className="mt-4 text-text-secondary">No successful Razorpay transactions found.</p>
      ) : (
        <div className={adminTableWrapperClass}>
          <table className={adminCompactTableClass}>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Order ID</th>
                <th className={adminCompactThClass}>Customer</th>
                <th className={adminCompactThClass}>Razorpay ID</th>
                <th className={adminCompactThClass}>Amount</th>
                <th className={adminCompactThClass}>Type</th>
                <th className={adminCompactThClass}>Date</th>
                <th className={adminCompactThClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((order) => (
                <tr
                  key={order._id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                >
                  <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                    {getOrderDisplayId(order)}
                  </td>
                  <td className={adminCompactTdClass}>
                    <p className="truncate font-medium text-neutral-900">
                      {getCustomerName(order)}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-neutral-500">
                      {getCustomerPhone(order)}
                    </p>
                  </td>
                  <td className={`${adminCompactTdClass} font-mono text-[10px] text-neutral-600`}>
                    {getRazorpayPaymentId(order) || "—"}
                  </td>
                  <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                    {formatPrice(getRazorpayTransactionAmount(order))}
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    {getRazorpayPaymentTypeLabel(order)}
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    {formatDate(getRazorpayPaidAt(order))}
                  </td>
                  <td className={adminCompactTdClass}>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg border border-primary px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-orange-50"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            loading={loading}
            onPageChange={setPage}
          />
        </div>
      )}

      {selectedOrder && (
        <PaymentDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

export default PaymentSection;
