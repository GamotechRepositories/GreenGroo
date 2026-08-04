import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminOrders } from "../../../api/api";
import { useAdminOrdersQuery } from "../../../hooks/queries/useAdminOrdersQuery";
import { useAuth } from "../../../context/AuthContext";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import AdminSearchBar from "../AdminSearchBar";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminFilterCardClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
  cardClass,
} from "../adminStyles";
import {
  downloadRevenueCsv,
  formatDate,
  formatPrice,
  getCustomerName,
  getCustomerPhone,
  getOrderDisplayId,
  getOrderStatusLabel,
  normalizeAdminSearchQuery,
} from "./adminOrderUtils";

function getErrorMessage(err, fallback) {
  return err.response?.data?.message || err.message || fallback;
}

function buildRevenueExportFilename(startDate, endDate) {
  if (startDate && endDate) return `revenue-${startDate}-to-${endDate}.csv`;
  if (startDate) return `revenue-from-${startDate}.csv`;
  if (endDate) return `revenue-until-${endDate}.csv`;
  return "revenue.csv";
}

function RevenueSection() {
  const navigate = useNavigate();
  const { adminUser } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, searchQuery]);

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: ADMIN_PAGE_SIZE,
      statusGroup: "revenue",
    };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (searchQuery.trim()) params.search = normalizeAdminSearchQuery(searchQuery);
    return params;
  }, [page, startDate, endDate, searchQuery]);

  const { data, isLoading, isFetching, isError, error: queryError } = useAdminOrdersQuery(
    queryParams,
    { enabled: adminUser?.role === "admin" }
  );

  const orders = data?.items || [];
  const pagination = data?.pagination || {
    page,
    limit: ADMIN_PAGE_SIZE,
    total: orders.length,
    totalPages: 1,
  };
  const amountTotal = Number(data?.amountTotal) || 0;
  const loading = isLoading || isFetching;
  const loadError = isError ? getErrorMessage(queryError, "Failed to load revenue orders") : "";

  const handleDownload = async () => {
    try {
      setError("");
      setDownloading(true);
      const params = {
        limit: 10000,
        statusGroup: "revenue",
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchQuery.trim()) params.search = normalizeAdminSearchQuery(searchQuery);
      const { data: exportData } = await getAdminOrders(params);
      downloadRevenueCsv(exportData.data || [], buildRevenueExportFilename(startDate, endDate));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to download revenue Excel"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      <AdminAlert
        error={error || loadError}
        success=""
        onClear={() => setError("")}
      />

      <div className={adminFilterCardClass}>
        <div className="mb-4">
          <AdminSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by order ID, product, or customer..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-5 sm:gap-6 lg:gap-8">
          <div className="flex min-w-0 items-center gap-2">
            <label className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="min-w-0 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none sm:w-40"
            />
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <label className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="min-w-0 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none sm:w-40"
            />
          </div>

          <div className={`${cardClass} flex min-w-[12rem] flex-1 items-center gap-2 px-3 py-2 sm:max-w-xs sm:flex-none`}>
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Total Revenue
            </span>
            <span className="truncate text-sm font-bold text-neutral-900 sm:text-base">
              {loading ? "—" : formatPrice(amountTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="shrink-0 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? "Downloading..." : "Download Excel"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading revenue orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-text-secondary">No confirmed revenue orders found.</p>
      ) : (
        <div className={adminTableWrapperClass}>
          <table className={adminCompactTableClass}>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Order ID</th>
                <th className={adminCompactThClass}>Customer</th>
                <th className={adminCompactThClass}>Status</th>
                <th className={adminCompactThClass}>Amount</th>
                <th className={adminCompactThClass}>Invoice</th>
                <th className={adminCompactThClass}>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                >
                  <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                    {getOrderDisplayId(order)}
                  </td>
                  <td className={adminCompactTdClass}>
                    <p className="truncate font-medium text-neutral-900">{getCustomerName(order)}</p>
                    <p className="mt-0.5 truncate text-[10px] text-neutral-500">
                      {getCustomerPhone(order)}
                    </p>
                  </td>
                  <td className={adminCompactTdClass}>
                    <span className="text-[10px] font-medium capitalize text-neutral-600">
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                    {formatPrice(order.total)}
                  </td>
                  <td className={adminCompactTdClass} onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/orders/${order._id}/invoice`}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      View Invoice
                    </Link>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    {formatDate(order.createdAt)}
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
    </div>
  );
}

export default RevenueSection;
