import { useEffect, useState } from "react";
import { getAddressFullName, formatAddressLine } from "../../../utils/addressDisplay";
import { getAdminPaymentProof, updateAdminPaymentProof } from "../../../api/api";
import {
  formatPrice,
  getCustomerName,
  getCustomerPhone,
  getOrderDisplayId,
  getOrderMessage,
  getOrderStatusLabel,
  getProductSummary,
  getRazorpayPaidAt,
  getRazorpayPaymentId,
  getRazorpayPaymentTypeLabel,
  getRazorpayTransactionAmount,
} from "./adminOrderUtils";

function getErrorMessage(err, fallback) {
  return err.response?.data?.message || err.message || fallback;
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getProofStatusLabel(status) {
  if (status === "verified") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function getProofStatusBadgeClass(status) {
  if (status === "verified") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function getPaymentStatusBadgeClass(status) {
  if (status === "paid") return "bg-green-100 text-green-800";
  if (status === "paid_10") return "bg-lime-100 text-lime-800";
  if (status === "refundable") return "bg-blue-100 text-blue-800";
  return "bg-neutral-100 text-neutral-700";
}

function getPaymentStatusLabel(status) {
  if (status === "paid_10") return "Paid 10%";
  if (status === "paid") return "Paid";
  if (status === "refundable") return "Refundable";
  return "Unpaid";
}

function DetailRow({ label, value, mono = false, className = "" }) {
  return (
    <p className={className}>
      <span className="font-semibold text-neutral-700">{label}:</span>{" "}
      <span className={mono ? "font-mono text-xs break-all" : ""}>{value ?? "—"}</span>
    </p>
  );
}

function PaymentDetailModal({ order, proofId, onClose, onUpdated }) {
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(Boolean(proofId));
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const isRazorpayView = Boolean(order) && !proofId;

  useEffect(() => {
    if (!proofId) {
      setProof(null);
      setLoading(false);
      return undefined;
    }

    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await getAdminPaymentProof(proofId);
        if (active) setProof(data.data);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load payment details"));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [proofId]);

  const handleReview = async (status) => {
    if (!proofId) return;

    try {
      setActionLoading(true);
      setError("");
      await updateAdminPaymentProof(proofId, {
        status,
        rejectionReason: status === "rejected" ? rejectionReason : "",
      });
      onUpdated?.(status);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update payment"));
    } finally {
      setActionLoading(false);
    }
  };

  if (!order && !proofId) return null;

  const items = proof?.items?.length ? proof.items : order?.items || [];
  const deliveryAddress = proof?.deliveryAddress || order?.deliveryAddress;
  const customerEmail =
    proof?.user?.email || proof?.deliveryAddress?.email || order?.deliveryAddress?.email || "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-neutral-900">
            {isRazorpayView ? "Razorpay Payment" : "Payment Proof"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm font-semibold text-neutral-500 hover:bg-neutral-100"
          >
            Close
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : error && !order && !proof ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="space-y-5 text-sm">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>
            )}

            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                Order
              </h4>
              <div className="grid gap-3 rounded-lg bg-neutral-50 p-3 sm:grid-cols-2">
                <DetailRow label="Order ID" value={proof?.orderNumber || getOrderDisplayId(order)} />
                <DetailRow
                  label="Order status"
                  value={getOrderStatusLabel(proof?.order?.status || order?.status)}
                />
                <DetailRow
                  label="Payment status"
                  value={
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        proof
                          ? getProofStatusBadgeClass(proof.status)
                          : getPaymentStatusBadgeClass(order?.paymentStatus)
                      }`}
                    >
                      {proof
                        ? getProofStatusLabel(proof.status)
                        : getPaymentStatusLabel(order?.paymentStatus)}
                    </span>
                  }
                />
                {isRazorpayView ? (
                  <DetailRow label="Payment type" value={getRazorpayPaymentTypeLabel(order)} />
                ) : null}
                <DetailRow
                  label="Date"
                  value={formatDateTime(
                    isRazorpayView ? getRazorpayPaidAt(order) : proof?.createdAt || order?.createdAt
                  )}
                />
                {proof?.verifiedAt ? (
                  <DetailRow label="Reviewed on" value={formatDateTime(proof.verifiedAt)} />
                ) : null}
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                Customer
              </h4>
              <div className="grid gap-3 rounded-lg bg-neutral-50 p-3 sm:grid-cols-2">
                <DetailRow label="Name" value={proof?.user?.name || getCustomerName(order)} />
                <DetailRow
                  label="Phone"
                  value={proof?.user?.phone || proof?.deliveryAddress?.number || getCustomerPhone(order)}
                />
                <DetailRow label="Email" value={customerEmail} className="sm:col-span-2" />
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                Payment
              </h4>
              <div className="grid gap-3 rounded-lg bg-neutral-50 p-3 sm:grid-cols-2">
                {isRazorpayView ? (
                  <>
                    <DetailRow
                      label="Razorpay payment ID"
                      value={getRazorpayPaymentId(order) || "—"}
                      mono
                      className="sm:col-span-2"
                    />
                    <DetailRow
                      label="Razorpay order ID"
                      value={order?.razorpayOrderId || "—"}
                      mono
                      className="sm:col-span-2"
                    />
                    <DetailRow
                      label="Amount charged"
                      value={formatPrice(getRazorpayTransactionAmount(order))}
                    />
                    <DetailRow label="Current order total" value={formatPrice(order?.total)} />
                  </>
                ) : (
                  <>
                    <DetailRow
                      label="UPI / transaction ref"
                      value={proof?.upiTransactionRef || "—"}
                      mono
                      className="sm:col-span-2"
                    />
                    <DetailRow label="Amount paid" value={formatPrice(proof?.amount)} />
                    <DetailRow
                      label="Order total"
                      value={formatPrice(proof?.orderTotal ?? order?.total)}
                    />
                    {proof?.paymentType ? (
                      <DetailRow label="Payment type" value={proof.paymentType} />
                    ) : null}
                  </>
                )}
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                Products
              </h4>
              <ul className="rounded-lg bg-neutral-50 p-3 text-neutral-800">
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <li key={`${item.product || item.name}-${index}`} className="py-0.5">
                      {item.name} × {item.quantity}
                      {item.price != null ? ` — ${formatPrice(item.price * item.quantity)}` : ""}
                    </li>
                  ))
                ) : (
                  <li>{getProductSummary(order) || "—"}</li>
                )}
              </ul>
            </section>

            {deliveryAddress ? (
              <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                  Delivery address
                </h4>
                <p className="rounded-lg bg-neutral-50 p-3 text-neutral-800">
                  {getAddressFullName(deliveryAddress)}, {deliveryAddress.number}
                  {deliveryAddress.email ? (
                    <>
                      <br />
                      {deliveryAddress.email}
                    </>
                  ) : null}
                  <br />
                  {formatAddressLine(deliveryAddress)}
                </p>
              </section>
            ) : null}

            {(proof?.customerMessage || getOrderMessage(order)) ? (
              <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                  Customer note
                </h4>
                <p className="rounded-lg bg-neutral-50 p-3 text-neutral-800">
                  {proof?.customerMessage || getOrderMessage(order)}
                </p>
              </section>
            ) : null}

            {proof?.screenshot ? (
              <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                  Payment screenshot
                </h4>
                <img
                  src={proof.screenshot}
                  alt={proof.screenshotName || "Payment screenshot"}
                  className="max-h-96 rounded-lg border border-neutral-200 object-contain"
                />
              </section>
            ) : null}

            {proof?.status === "rejected" && proof.rejectionReason ? (
              <div className="rounded-lg bg-red-50 p-3 text-red-800">
                <p className="font-semibold">Rejection reason</p>
                <p className="mt-1">{proof.rejectionReason}</p>
              </div>
            ) : null}

            {proof?.status === "pending" ? (
              <div className="space-y-3 border-t border-neutral-100 pt-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-600">
                    Rejection reason (only if rejecting)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Optional reason for customer"
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleReview("verified")}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve payment
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleReview("rejected")}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentDetailModal;
