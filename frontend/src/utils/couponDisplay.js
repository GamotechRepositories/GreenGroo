const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

export function formatCouponHeadline(coupon) {
  if (coupon?.title?.trim()) return coupon.title.trim();

  const min = Number(coupon?.minOrderAmount || 0);
  if (coupon?.discountType === "percentage") {
    return `Flat ${coupon.discountValue}% off on orders above ₹${formatAmount(min)}`;
  }

  return `Flat ₹${formatAmount(coupon?.discountValue || 0)} on orders above ₹${formatAmount(min)}`;
}

export function formatCouponUnlockMessage(coupon) {
  if (coupon?.redemptionBlocked) {
    return coupon.redemptionBlocked;
  }

  if (coupon?.unlocked) {
    return coupon.discountAmount > 0
      ? `You save ₹${formatAmount(coupon.discountAmount)} on this order`
      : "Unlocked for your cart";
  }

  if (coupon?.amountNeeded > 0) {
    return `Shop for ₹${formatAmount(coupon.amountNeeded)} more to unlock`;
  }

  return "Add items to your cart to unlock";
}

export function formatCouponValidity(endDate) {
  if (!endDate) return "";
  return new Date(endDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
