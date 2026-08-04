export const SUPPORT_ISSUE_OPTIONS = [
  { value: "payment", label: "Payment Issue" },
  { value: "order", label: "Order Issue" },
  { value: "return_refund", label: "Return & Refund" },
  { value: "product_inquiry", label: "Product Inquiry" },
  { value: "delivery", label: "Delivery Issue" },
  { value: "place_order", label: "Want to place order?" },
  { value: "other", label: "Other" },
];

export function getIssueTypeLabel(value) {
  return SUPPORT_ISSUE_OPTIONS.find((option) => option.value === value)?.label || value || "—";
}
