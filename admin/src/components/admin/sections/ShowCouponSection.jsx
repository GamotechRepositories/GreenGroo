import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteCoupon, getAllCoupons } from "../../../api/api";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import { IconEdit, IconTrash } from "../AdminIcons";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
  btnPrimary,
  iconBtnClass,
  iconBtnDangerClass,
  pageHeaderActionsClass,
  pageHeaderClass,
} from "../adminStyles";

function getCouponStatusLabel(coupon) {
  if (!coupon.isActive) return { label: "Inactive", className: "bg-neutral-100 text-neutral-600" };
  const now = new Date();
  const start = new Date(coupon.startDate);
  const end = new Date(coupon.endDate);
  if (now < start) return { label: "Scheduled", className: "bg-blue-100 text-blue-700" };
  if (now > end) return { label: "Expired", className: "bg-red-100 text-red-700" };
  return { label: "Active", className: "bg-green-100 text-green-700" };
}

function formatDiscount(coupon) {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}% off`;
  }
  return `₹${coupon.discountValue} off`;
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRedemptionLimit(limit) {
  if (limit === null || limit === undefined) return "∞";
  return String(limit);
}

function ShowCouponSection() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ADMIN_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getAllCoupons({ page, limit: ADMIN_PAGE_SIZE });
      setCoupons(data.data || []);
      setPagination(
        data.pagination || {
          page,
          limit: ADMIN_PAGE_SIZE,
          total: data.data?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load coupons");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleEdit = (coupon) => {
    navigate("/coupons/add", { state: { editCoupon: coupon } });
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(""), 2000);
    } catch {
      setCopiedCode("");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      setError("");
      setSuccess("");
      await deleteCoupon(id);
      setSuccess("Coupon deleted");
      const nextPage = coupons.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete coupon");
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      <AdminAlert
        error={error}
        success={success}
        onClear={() => {
          setError("");
          setSuccess("");
        }}
      />

      <div className={pageHeaderClass}>
        <div>
          <h2 className="text-lg font-bold text-text-primary">Coupons</h2>
          <p className="mt-1 text-sm text-text-secondary">
            All coupons ({pagination.total})
          </p>
        </div>
        <div className={pageHeaderActionsClass}>
          <button
            type="button"
            onClick={() => navigate("/coupons/add")}
            className={btnPrimary}
          >
            Create Coupon
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading coupons...</p>
      ) : coupons.length === 0 ? (
        <p className="text-text-secondary">No coupons yet.</p>
      ) : (
        <div className={adminTableWrapperClass}>
          <table className={adminCompactTableClass}>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Code</th>
                <th className={adminCompactThClass}>Discount</th>
                <th className={adminCompactThClass}>Valid From</th>
                <th className={adminCompactThClass}>Valid Until</th>
                <th className={adminCompactThClass}>Min Order</th>
                <th className={adminCompactThClass}>Per User</th>
                <th className={adminCompactThClass}>Total Limit</th>
                <th className={adminCompactThClass}>Used</th>
                <th className={adminCompactThClass}>Status</th>
                <th className={adminCompactThClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const status = getCouponStatusLabel(coupon);
                return (
                  <tr key={coupon._id} className="border-b border-neutral-100 last:border-0">
                    <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                      <div className="flex items-center gap-1.5">
                        <span className="block">{coupon.code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(coupon.code)}
                          className="inline-flex shrink-0 items-center gap-1 rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 transition hover:border-primary/40 hover:text-primary"
                          title="Copy coupon code"
                          aria-label={`Copy coupon code ${coupon.code}`}
                        >
                          {copiedCode === coupon.code ? "Copied" : "Copy"}
                        </button>
                      </div>
                      {coupon.title ? (
                        <span className="mt-0.5 block text-[10px] font-normal text-neutral-500">
                          {coupon.title}
                        </span>
                      ) : null}
                    </td>
                    <td className={adminCompactTdClass}>{formatDiscount(coupon)}</td>
                    <td className={adminCompactTdClass}>{formatDateTime(coupon.startDate)}</td>
                    <td className={adminCompactTdClass}>{formatDateTime(coupon.endDate)}</td>
                    <td className={adminCompactTdClass}>₹{coupon.minOrderAmount || 0}</td>
                    <td className={adminCompactTdClass}>
                      {formatRedemptionLimit(coupon.maxRedemptionsPerUser)}
                    </td>
                    <td className={adminCompactTdClass}>
                      {formatRedemptionLimit(coupon.maxTotalRedemptions)}
                    </td>
                    <td className={adminCompactTdClass}>{coupon.totalRedemptions || 0}</td>
                    <td className={adminCompactTdClass}>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className={adminCompactTdClass}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(coupon)}
                          className={iconBtnClass}
                          title="Edit coupon"
                          aria-label="Edit coupon"
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(coupon._id)}
                          className={iconBtnDangerClass}
                          title="Delete coupon"
                          aria-label="Delete coupon"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

export default ShowCouponSection;
