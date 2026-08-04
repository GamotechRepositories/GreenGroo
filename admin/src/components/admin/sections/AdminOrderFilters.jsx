import {
  adminFilterCardClass,
  adminFilterInputClass,
  adminFilterLabelClass,
} from "../adminStyles";
import AdminSearchBar from "../AdminSearchBar";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "./adminOrderUtils";

function AdminOrderFilters({
  startDate,
  endDate,
  orderStatus,
  paymentStatus,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search by order ID, product, customer, or phone...",
  onStartDateChange,
  onEndDateChange,
  onOrderStatusChange,
  onPaymentStatusChange,
  onDownload,
  showOrderStatus = true,
  showPaymentStatus = true,
  statusCounts = null,
}) {
  const formatStatusLabel = (opt) => {
    if (!statusCounts || statusCounts[opt.value] == null) {
      return opt.label;
    }
    return `${opt.label} (${statusCounts[opt.value]})`;
  };

  const statusOptions =
    orderStatus === "pending"
      ? [
          ...ORDER_STATUS_OPTIONS.slice(0, 2),
          { value: "pending", label: "Pending" },
          ...ORDER_STATUS_OPTIONS.slice(2),
        ]
      : ORDER_STATUS_OPTIONS;

  return (
    <div className={adminFilterCardClass}>
      {onSearchChange ? (
        <div className="mb-4">
          <AdminSearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <div className="min-w-0">
            <label className={adminFilterLabelClass}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={adminFilterInputClass}
            />
          </div>

          <div className="min-w-0">
            <label className={adminFilterLabelClass}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className={adminFilterInputClass}
            />
          </div>

          {showOrderStatus && (
            <div className="min-w-0">
              <label className={adminFilterLabelClass}>Order Status</label>
              <select
                value={orderStatus}
                onChange={(e) => onOrderStatusChange(e.target.value)}
                className={adminFilterInputClass}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {formatStatusLabel(opt)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showPaymentStatus && (
            <div className="min-w-0">
              <label className={adminFilterLabelClass}>Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => onPaymentStatusChange(e.target.value)}
                className={adminFilterInputClass}
              >
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDownload}
          className="w-full shrink-0 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:w-auto lg:mb-0"
        >
          Download XLS
        </button>
      </div>
    </div>
  );
}

export default AdminOrderFilters;
