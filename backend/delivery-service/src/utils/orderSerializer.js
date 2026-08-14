export function serializeOrderForRider(order) {
  if (!order) return null;
  const doc = typeof order.toObject === "function" ? order.toObject() : order;
  const isAddressVisible = doc.addressUnlocked && !doc.addressHiddenAfterDelivery;

  return {
    _id: doc._id,
    managerId: doc.managerId || doc.storeId,
    pickupAddress: doc.pickupAddress || "",
    status: doc.status,
    items: doc.items || [],
    totalAmount: doc.totalAmount || 0,
    paymentMethod: doc.paymentMethod || "online",
    paymentStatus: doc.paymentStatus || "pending",
    amountToCollect: doc.amountToCollect || 0,
    deliveryFee: doc.deliveryFee || 0,
    isPeakOrder: Boolean(doc.isPeakOrder),
    peakBonus: doc.peakBonus || 0,
    customerName: isAddressVisible ? doc.customerName : null,
    customerAddress: isAddressVisible ? doc.customerAddress : null,
    customerPhone: isAddressVisible ? doc.customerPhone : null,
    customerLocation: isAddressVisible ? doc.customerLocation : null,
    addressStatus: doc.addressHiddenAfterDelivery
      ? "hidden_post_delivery"
      : doc.addressUnlocked
      ? "visible"
      : "locked_until_scan",
    orderTimestamps: doc.orderTimestamps || {},
  };
}

export default { serializeOrderForRider };
