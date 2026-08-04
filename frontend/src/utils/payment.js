export const ADVANCE_PAYMENT_PERCENT = 0.1;

export const PAYMENT_PLAN = {
  ADVANCE: "cod_advance",
  FULL: "online",
};

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID_10: "paid_10",
  PAID: "paid",
  REFUNDABLE: "refundable",
  PENDING_VERIFICATION: "pending_verification",
};

export const PAYMENT_STATUS_LABELS = {
  unpaid: "Unpaid",
  paid_10: "Paid 10%",
  paid: "Paid",
  refundable: "Refundable",
  pending_verification: "Pending verification",
};

export function calculateAdvanceAmount(total) {
  const amount = Number(total) || 0;
  return Math.round(amount * ADVANCE_PAYMENT_PERCENT * 100) / 100;
}

export function calculatePayableAmount(total, paymentMode) {
  const amount = Number(total) || 0;
  if (paymentMode === PAYMENT_PLAN.ADVANCE) {
    return calculateAdvanceAmount(amount);
  }
  return Math.round(amount * 100) / 100;
}

export function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status;
}

export function getCheckoutPaymentMethod(paymentPlan) {
  return paymentPlan === PAYMENT_PLAN.ADVANCE ? "cod" : "online";
}
