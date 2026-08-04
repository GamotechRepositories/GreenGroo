export const ADVANCE_PAYMENT_PERCENT = 0.1;

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

export function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status;
}

export function getPaymentStatusBadgeClass(status) {
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "paid_10") return "bg-lime-100 text-lime-800";
  if (status === "refundable") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-800";
}
