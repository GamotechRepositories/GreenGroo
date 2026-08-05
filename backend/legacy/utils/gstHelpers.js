export const GST_INCLUDED_NOTE = "All prices include GST.";

export function calculateGstAmount() {
  return 0;
}

export function calculateOrderTotal(subtotal, deliveryCharges = 0) {
  const normalizedSubtotal = Number(subtotal) || 0;
  const normalizedDelivery = Number(deliveryCharges) || 0;
  const total = normalizedSubtotal + normalizedDelivery;
  return {
    gstAmount: 0,
    total: Math.round(total * 100) / 100,
  };
}

export function getOrderGstAmount() {
  return 0;
}
