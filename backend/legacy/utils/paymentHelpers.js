export const ADVANCE_PAYMENT_PERCENT = 0.1;

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID_10: "paid_10",
  PAID: "paid",
  REFUNDABLE: "refundable",
  PENDING_VERIFICATION: "pending_verification",
};

export const ADMIN_PAYMENT_STATUSES = [
  PAYMENT_STATUS.UNPAID,
  PAYMENT_STATUS.PAID_10,
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.REFUNDABLE,
  PAYMENT_STATUS.PENDING_VERIFICATION,
];

export const RAZORPAY_SUCCESS_PAYMENT_STATUSES = [
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.PAID_10,
  PAYMENT_STATUS.REFUNDABLE,
];

export function calculateAdvanceAmount(total) {
  const amount = Number(total) || 0;
  return Math.round(amount * ADVANCE_PAYMENT_PERCENT * 100) / 100;
}

export function calculatePayableAmount(total, paymentMode) {
  const amount = Number(total) || 0;
  if (paymentMode === "cod_advance") {
    return calculateAdvanceAmount(amount);
  }
  return Math.round(amount * 100) / 100;
}

/** Amount actually paid as COD advance — never recalculated from current order total. */
export function getRecordedAdvancePaidAmount(order, verifiedPayment = null) {
  if (order?.paymentStatus !== PAYMENT_STATUS.PAID_10) {
    return 0;
  }

  if (verifiedPayment && Number(verifiedPayment.amount) > 0) {
    return Math.round(Number(verifiedPayment.amount) * 100) / 100;
  }

  const razorpayPaid = Number(order?.razorpayPaidAmount) || 0;
  if (razorpayPaid > 0) {
    return Math.round(razorpayPaid * 100) / 100;
  }

  const stored = Number(order?.codAdvanceAmount) || 0;
  if (stored > 0) {
    return Math.round(stored * 100) / 100;
  }

  return 0;
}

export function hasSuccessfulRazorpayPayment(order) {
  const hasPaymentId =
    Boolean(String(order?.razorpayPaymentId || "").trim()) ||
    Boolean(String(order?.codAdvanceRazorpayPaymentId || "").trim());

  if (!hasPaymentId) return false;

  return RAZORPAY_SUCCESS_PAYMENT_STATUSES.includes(order?.paymentStatus);
}

export function getRazorpayTransactionAmount(order) {
  if (!order) return 0;

  const storedPaid = Number(order.razorpayPaidAmount) || 0;
  if (storedPaid > 0) {
    return Math.round(storedPaid * 100) / 100;
  }

  if (order.paymentStatus === PAYMENT_STATUS.PAID_10) {
    return getRecordedAdvancePaidAmount(order);
  }

  if (String(order.razorpayPaymentId || "").trim()) {
    return Math.round((Number(order.total) || 0) * 100) / 100;
  }

  if (String(order.codAdvanceRazorpayPaymentId || "").trim()) {
    return getRecordedAdvancePaidAmount(order);
  }

  return 0;
}

export function getRazorpayPaymentId(order) {
  if (!order) return "";
  return String(order.razorpayPaymentId || order.codAdvanceRazorpayPaymentId || "").trim();
}

export function getRazorpayPaidAt(order) {
  if (!order) return null;
  return order.paidAt || order.codAdvancePaidAt || order.createdAt || null;
}
