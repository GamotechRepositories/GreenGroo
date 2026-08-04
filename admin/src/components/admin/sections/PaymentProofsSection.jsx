import { useCallback, useEffect, useState } from "react";
import { getAdminPaymentProofs } from "../../../api/api";
import { useAuth } from "../../../context/AuthContext";
import { useAdminNotifications } from "../../../context/AdminNotificationContext";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
} from "../adminStyles";
import PaymentDetailModal from "./PaymentDetailModal";
import { formatDate, formatPrice, getCustomerName, getCustomerPhone } from "./adminOrderUtils";

function getErrorMessage(err, fallback) {
  return err.response?.data?.message || err.message || fallback;
}

function PaymentProofsSection() {
  const { adminUser } = useAuth();
  const { markPaymentsAsSeen } = useAdminNotifications();
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProofId, setSelectedProofId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ADMIN_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    markPaymentsAsSeen();
  }, [markPaymentsAsSeen]);

  const fetchData = useCallback(async () => {
    if (adminUser?.role !== "admin") return;

    try {
      setLoading(true);
      setError("");
      const { data } = await getAdminPaymentProofs({
        page,
        limit: ADMIN_PAGE_SIZE,
        status: "pending",
      });
      const loadedProofs = data.data || [];
      setProofs(loadedProofs);
      setPagination(
        data.pagination || {
          page,
          limit: ADMIN_PAGE_SIZE,
          total: loadedProofs.length,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load payment proofs"));
      setProofs([]);
    } finally {
      setLoading(false);
    }
  }, [adminUser, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-w-0">
      <AdminAlert
        error={error}
        success={success}
        onClear={() => {
          setError("");
          setSuccess("");
        }}
      />

      <p className="mb-1 text-sm font-medium text-neutral-700">
        {pagination.total} pending UPI payment proof{pagination.total === 1 ? "" : "s"}
      </p>
      <p className="mb-4 text-xs text-neutral-500">
        Review customer UPI screenshots here. Successful Razorpay payments are listed under Payments.
      </p>

      {loading ? (
        <p className="mt-4 text-text-secondary">Loading payment proofs...</p>
      ) : proofs.length === 0 ? (
        <p className="mt-4 text-text-secondary">No pending payment proofs.</p>
      ) : (
        <div className={adminTableWrapperClass}>
          <table className={adminCompactTableClass}>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Order ID</th>
                <th className={adminCompactThClass}>Customer</th>
                <th className={adminCompactThClass}>Amount</th>
                <th className={adminCompactThClass}>Type</th>
                <th className={adminCompactThClass}>Submitted</th>
                <th className={adminCompactThClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {proofs.map((proof) => (
                <tr
                  key={proof._id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                >
                  <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                    {proof.orderNumber || proof.order?.orderNumber || "—"}
                  </td>
                  <td className={adminCompactTdClass}>
                    <p className="truncate font-medium text-neutral-900">
                      {proof.user?.name || getCustomerName(proof.order)}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-neutral-500">
                      {proof.user?.phone || proof.deliveryAddress?.number || getCustomerPhone(proof.order)}
                    </p>
                  </td>
                  <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                    {formatPrice(proof.amount)}
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    {proof.paymentType === "cod_advance" ? "COD advance (10%)" : "Online full"}
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    {formatDate(proof.createdAt)}
                  </td>
                  <td className={adminCompactTdClass}>
                    <button
                      type="button"
                      onClick={() => setSelectedProofId(proof._id)}
                      className="rounded-lg border border-primary px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-orange-50"
                    >
                      Review
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

      {selectedProofId && (
        <PaymentDetailModal
          proofId={selectedProofId}
          onClose={() => setSelectedProofId(null)}
          onUpdated={(status) => {
            setSuccess(
              status === "verified"
                ? "Payment approved successfully"
                : "Payment rejected and order cancelled"
            );
            fetchData();
          }}
        />
      )}
    </div>
  );
}

export default PaymentProofsSection;
