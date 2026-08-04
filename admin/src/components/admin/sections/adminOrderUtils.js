import { getOrderNumber } from "../../../utils/orderNumber";
import { getAddressFullName } from "../../../utils/addressDisplay";

export const ORDER_STATUSES = [
  "attempted",
  "confirm",
  "processing",
  "shipping",
  "delivered",
  "cancelled",
  "return",
];

export const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "attempted", label: "Attempted" },
  { value: "confirm", label: "Confirm" },
  { value: "processing", label: "Processing" },
  { value: "shipping", label: "Shipping" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "return", label: "Return" },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid_10", label: "Paid 10%" },
  { value: "paid", label: "Paid" },
  { value: "pending_verification", label: "Pending verification" },
  { value: "refundable", label: "Refundable" },
];

export function normalizeAdminSearchQuery(value) {
  return String(value || "")
    .trim()
    .replace(/^#+/, "")
    .trim();
}

export const ADMIN_DETAIL_ORDER_STATUS_OPTIONS = [
  { value: "attempted", label: "attempted" },
  { value: "confirm", label: "confirm" },
  { value: "processing", label: "processing" },
  { value: "shipping", label: "shipping" },
  { value: "delivered", label: "delivered" },
  { value: "cancelled", label: "cancelled" },
  { value: "return", label: "return" },
];

export const ADMIN_DETAIL_PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid", label: "unpaid" },
  { value: "paid_10", label: "paid 10%" },
  { value: "paid", label: "paid" },
  { value: "refundable", label: "refundable" },
];

export const ORDER_PROGRESS_STEPS = [
  "Confirm",
  "Processing",
  "Shipping",
  "Delivered",
  "Cancelled",
  "Return",
];

export const ORDER_STATUS_STEP_INDEX = {
  attempted: -1,
  confirm: 0,
  processing: 1,
  shipping: 2,
  delivered: 3,
  cancelled: 4,
  return: 5,
  // legacy values from older orders
  pending: 0,
  confirmed: 0,
  shipped: 2,
};

export const formatDateTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const STATUS_LABELS = {
  attempted: "Attempted",
  confirm: "Confirm",
  processing: "Processing",
  shipping: "Shipping",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return: "Return",
  pending: "Confirm",
  confirmed: "Confirm",
  shipped: "Shipping",
};

export function getOrderStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

const ORDER_ITEM_LOCKED_STATUSES = new Set(["shipping", "delivered", "cancelled", "return"]);

export function canEditOrderItems(status) {
  return !ORDER_ITEM_LOCKED_STATUSES.has(status);
}

export function getOrderMessage(order) {
  return (order?.message || order?.customerNote || order?.customerMessage || "").trim();
}

export const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function getCustomerName(order) {
  return order.user?.name || getAddressFullName(order.deliveryAddress) || "—";
}

export function getCustomerPhone(order) {
  return order.user?.phone || order.deliveryAddress?.number || "—";
}

export function getProductSummary(order) {
  if (!order.items?.length) return "—";
  if (order.items.length === 1) return order.items[0].name;
  return `${order.items[0].name} +${order.items.length - 1} more`;
}

export function getTotalQty(order) {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

export function getPaymentStatus(order) {
  return order.paymentStatus || "unpaid";
}

export { getPaymentStatusLabel } from "../../../utils/payment";

export function getPaymentStatusBadgeClass(payment) {
  if (payment === "paid") return "bg-green-100 text-green-700";
  if (payment === "paid_10") return "bg-lime-100 text-lime-800";
  if (payment === "refundable") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-800";
}

export function getOrderDisplayId(order) {
  return `#${getOrderNumber(order)}`;
}

export function getPaymentMethodLabel(order) {
  return order.paymentMethod === "cod" ? "COD" : "Online";
}

export function getTransactionId(order) {
  if (!order) return "";

  if (order.razorpayPaymentId) return order.razorpayPaymentId;
  if (order.codAdvanceRazorpayPaymentId) return order.codAdvanceRazorpayPaymentId;
  if (order.paymentMethod === "online" && order.razorpayOrderId) {
    return order.razorpayOrderId;
  }

  return "";
}

export function getRazorpayPaymentId(order, proof) {
  if (proof?.razorpayPaymentId) return proof.razorpayPaymentId;
  if (!order) return "";
  return order.razorpayTransactionId || order.razorpayPaymentId || order.codAdvanceRazorpayPaymentId || "";
}

export function getRazorpayTransactionAmount(order) {
  if (!order) return 0;
  if (Number(order.razorpayTransactionAmount) > 0) return order.razorpayTransactionAmount;
  if (Number(order.razorpayPaidAmount) > 0) return order.razorpayPaidAmount;
  if (order.paymentStatus === "paid_10") {
    const recorded =
      Number(order.advancePaidAmount) > 0
        ? order.advancePaidAmount
        : Number(order.codAdvanceAmount) || 0;
    if (recorded > 0) return recorded;
  }
  if (order.razorpayPaymentId) return Number(order.total) || 0;
  if (order.codAdvanceRazorpayPaymentId) {
    return Number(order.codAdvanceAmount) || 0;
  }
  return 0;
}

export function getRazorpayPaidAt(order) {
  if (!order) return null;
  return order.razorpayPaidAt || order.paidAt || order.codAdvancePaidAt || order.createdAt || null;
}

export function getRazorpayPaymentTypeLabel(order) {
  if (!order) return "—";
  if (order.codAdvanceRazorpayPaymentId) return "COD advance (10%)";
  if (order.razorpayPaymentId) return "Online full";
  return "Razorpay";
}

export function getUpiTransactionId(_order, proof) {
  return proof?.upiTransactionRef || "";
}

export function getPaymentAmount(order, proof) {
  if (proof?.amount != null) return proof.amount;
  if (!order) return 0;
  if (order.paymentStatus === "paid_10") {
    const recorded =
      Number(order.advancePaidAmount) > 0
        ? order.advancePaidAmount
        : Number(order.codAdvanceAmount) || 0;
    if (recorded > 0) return recorded;
  }
  return order.total ?? 0;
}

export function getOrderAdvanceBillingSummary(order = {}) {
  const orderTotal = Number(order.total) || 0;
  const advancePaid =
    Number(order.advancePaidAmount) > 0
      ? Number(order.advancePaidAmount)
      : Number(order.codAdvanceAmount) || 0;
  const paymentStatus = String(order.paymentStatus || "unpaid");
  const isFullySettled = paymentStatus === "paid" || paymentStatus === "refundable";
  const hasAdvance = advancePaid > 0 && !isFullySettled;

  return {
    hasAdvance,
    advancePaid,
    orderTotal,
    remainingBalance: hasAdvance ? Math.max(0, orderTotal - advancePaid) : orderTotal,
  };
}

export function getOrderCouponBillingSummary(order = {}) {
  const couponCode = String(order.couponCode || "").trim();
  const couponDiscount = Number(order.couponDiscount) || 0;

  return {
    hasCoupon: Boolean(couponCode) || couponDiscount > 0,
    couponCode,
    couponDiscount: Math.max(0, couponDiscount),
  };
}

export function getPaidTypeLabel(order, proof) {
  if (proof) {
    return proof.paymentType === "cod_advance" ? "UPI · COD advance (10%)" : "UPI · Online full";
  }
  if (order?.razorpayPaymentId || order?.codAdvanceRazorpayPaymentId) return "Razorpay";
  return getPaymentMethodLabel(order);
}

function downloadCsv(headers, rows, filename) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadRazorpayPaymentsCsv(orders, filename = "razorpay-payments.csv") {
  const headers = [
    "Order ID",
    "Customer",
    "Phone",
    "Razorpay Payment ID",
    "Amount",
    "Type",
    "Order Total",
    "Date",
  ];

  const rows = orders.map((order) => [
    getOrderNumber(order),
    getCustomerName(order),
    getCustomerPhone(order),
    getRazorpayPaymentId(order),
    getRazorpayTransactionAmount(order),
    getRazorpayPaymentTypeLabel(order),
    order.total,
    formatDate(getRazorpayPaidAt(order)),
  ]);

  downloadCsv(headers, rows, filename);
}

export function downloadPaymentsCsv(orders, filename = "payments.csv") {
  const headers = [
    "Order ID",
    "Customer",
    "Phone",
    "Products",
    "Amount",
    "Method",
    "Payment",
    "Transaction ID",
    "Date",
  ];

  const rows = orders.map((order) => [
    getOrderNumber(order),
    getCustomerName(order),
    getCustomerPhone(order),
    getProductSummary(order),
    order.total,
    getPaymentMethodLabel(order),
    getPaymentStatus(order),
    getTransactionId(order),
    formatDate(order.createdAt),
  ]);

  downloadCsv(headers, rows, filename);
}

export function downloadOrdersCsv(orders, filename = "orders.csv") {
  const headers = [
    "Order ID",
    "Customer",
    "Phone",
    "Products",
    "Qty",
    "Price",
    "Status",
    "Payment",
    "Transaction ID",
    "Message",
    "Date",
  ];

  const rows = orders.map((order) => [
    getOrderNumber(order),
    getCustomerName(order),
    getCustomerPhone(order),
    getProductSummary(order),
    getTotalQty(order),
    order.total,
    getOrderStatusLabel(order.status),
    getPaymentStatus(order),
    getTransactionId(order),
    getOrderMessage(order),
    formatDate(order.createdAt),
  ]);

  downloadCsv(headers, rows, filename);
}

export function downloadRevenueCsv(orders, filename = "revenue.csv") {
  const headers = ["Order ID", "Customer", "Phone", "Invoice", "Status", "Amount", "Date"];

  const rows = orders.map((order) => [
    getOrderDisplayId(order),
    getCustomerName(order),
    getCustomerPhone(order),
    getOrderDisplayId(order),
    getOrderStatusLabel(order.status),
    order.total,
    formatDate(order.createdAt),
  ]);

  downloadCsv(headers, rows, filename);
}
