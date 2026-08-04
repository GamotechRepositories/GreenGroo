import { INDIAN_STATE_CODES, INVOICE_CONFIG } from "./invoiceConfig.js";

export function formatInvoiceAmount(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInvoiceDate(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function normalizeStateName(state = "") {
  return String(state).trim().toLowerCase();
}

export function getStateCode(state = "") {
  const normalized = normalizeStateName(state);
  if (!normalized) return "";
  return INDIAN_STATE_CODES[normalized] || INVOICE_CONFIG.stateCode;
}

export function formatPlaceOfSupply(state = "") {
  const code = getStateCode(state);
  const name = String(state || INVOICE_CONFIG.stateName).trim() || INVOICE_CONFIG.stateName;
  return code ? `${code} - ${name}` : name;
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

const ADVANCE_PAYMENT_PERCENT = 0.1;

export function calculateAdvanceAmount(total) {
  const amount = Number(total) || 0;
  return roundMoney(amount * ADVANCE_PAYMENT_PERCENT);
}

export function getInvoiceAdvancePaymentDetails(order) {
  const grandTotal = roundMoney(Number(order?.total) || 0);
  const isAdvancePaid = order?.paymentStatus === "paid_10";

  if (!isAdvancePaid) {
    return {
      isAdvancePaid: false,
      advancePaid: 0,
      remainingBalance: 0,
      remark: "",
    };
  }

  const advancePaid = roundMoney(
    Number(order?.advancePaidAmount) > 0
      ? order.advancePaidAmount
      : Number(order?.codAdvanceAmount) > 0
        ? order.codAdvanceAmount
        : 0
  );
  const remainingBalance = roundMoney(Math.max(0, grandTotal - advancePaid));

  return {
    isAdvancePaid: true,
    advancePaid,
    remainingBalance,
    remark: `10% advance amount of Rs. ${formatInvoiceAmount(advancePaid)} has been paid. Remaining balance of Rs. ${formatInvoiceAmount(remainingBalance)} is payable on delivery.`,
  };
}

export function splitInclusiveGst(amount, gstRate = INVOICE_CONFIG.defaultGstRate) {
  const inclusive = roundMoney(amount);
  const rate = Number(gstRate) || INVOICE_CONFIG.defaultGstRate;
  const taxableValue = roundMoney(inclusive / (1 + rate / 100));
  const gstAmount = roundMoney(inclusive - taxableValue);
  return { taxableValue, gstAmount, gstRate: rate, inclusive };
}

export function buildInvoiceLineItems(items = [], gstRate = INVOICE_CONFIG.defaultGstRate) {
  return (items || []).map((item, index) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.price) || 0;
    const inclusive = roundMoney(rate * qty);
    const split = splitInclusiveGst(inclusive, item.gstRate ?? gstRate);

    return {
      srNo: index + 1,
      name: item.name || "Item",
      hsn: item.hsn || item.hsnCode || INVOICE_CONFIG.defaultHsn,
      qty,
      rate,
      taxableValue: split.taxableValue,
      gstRate: split.gstRate,
      gstAmount: split.gstAmount,
      amount: split.inclusive,
    };
  });
}

export function buildInvoiceTotals({
  lineItems = [],
  deliveryCharges = 0,
  sellerState = INVOICE_CONFIG.stateName,
  customerState = "",
}) {
  const subTotal = roundMoney(lineItems.reduce((sum, item) => sum + item.taxableValue, 0));
  const totalGst = roundMoney(lineItems.reduce((sum, item) => sum + item.gstAmount, 0));
  const deliverySplit = splitInclusiveGst(deliveryCharges);
  const intraState =
    normalizeStateName(sellerState) === normalizeStateName(customerState || sellerState);

  const shippingTaxable = deliverySplit.taxableValue;
  const shippingGst = deliverySplit.gstAmount;
  const combinedGst = roundMoney(totalGst + shippingGst);

  const gstBreakdown = [];
  if (combinedGst > 0) {
    if (intraState) {
      gstBreakdown.push({
        label: `SGST ${INVOICE_CONFIG.defaultGstRate / 2}%`,
        amount: roundMoney(combinedGst / 2),
      });
      gstBreakdown.push({
        label: `CGST ${INVOICE_CONFIG.defaultGstRate / 2}%`,
        amount: roundMoney(combinedGst / 2),
      });
    } else {
      gstBreakdown.push({
        label: `IGST ${INVOICE_CONFIG.defaultGstRate}%`,
        amount: combinedGst,
      });
    }
  }

  const grandTotal = roundMoney(subTotal + combinedGst + shippingTaxable);

  return {
    subTotal,
    totalGst,
    shippingTaxable,
    shippingGst,
    deliveryCharges: roundMoney(deliveryCharges),
    gstBreakdown,
    grandTotal,
    intraState,
  };
}

export function mergeInvoiceConfig(storeSettings) {
  if (!storeSettings) return INVOICE_CONFIG;

  const upiId =
    storeSettings.merchantUpiId ||
    storeSettings.merchantUpiAccounts?.find((account) => account.enabled)?.upiId ||
    INVOICE_CONFIG.bank.upiId;

  return {
    ...INVOICE_CONFIG,
    bank: {
      ...INVOICE_CONFIG.bank,
      upiId,
      accountName: storeSettings.merchantUpiName || INVOICE_CONFIG.bank.accountName,
    },
  };
}

export const STATUS_LABELS = {
  confirm: "Confirmed",
  processing: "Processing",
  shipping: "Shipping",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return: "Return",
  attempted: "Attempted",
  pending: "Confirmed",
  confirmed: "Confirmed",
  shipped: "Shipping",
};

export function getPaymentStatusLabel(paymentStatus) {
  if (paymentStatus === "paid_10") return "10% Paid";
  if (paymentStatus === "paid") return "Paid";
  if (paymentStatus === "pending_verification") return "Pending Verification";
  if (paymentStatus === "refundable") return "Refundable";
  return "Unpaid";
}

export function getPaymentModeLabel(paymentMethod) {
  if (paymentMethod === "cod") return "Cash";
  if (paymentMethod === "online") return "Online";
  return paymentMethod || "—";
}
