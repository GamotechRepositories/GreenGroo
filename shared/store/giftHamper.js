export function normalizeGiftHamperTiers(tiers = []) {
  if (!Array.isArray(tiers)) return [];

  return [...tiers]
    .map((tier) => ({
      minOrderAmount: Number(tier?.minOrderAmount),
      gift: {
        name: String(tier?.gift?.name || "").trim(),
        description: String(tier?.gift?.description || "").trim(),
        image: String(tier?.gift?.image || "").trim(),
      },
    }))
    .filter(
      (tier) =>
        Number.isFinite(tier.minOrderAmount) &&
        tier.minOrderAmount > 0 &&
        tier.gift.name
    )
    .sort((a, b) => a.minOrderAmount - b.minOrderAmount);
}

export function resolveGiftHamperForOrder(total, settings = {}) {
  if (!settings.giftHampersEnabled) {
    return null;
  }

  const orderTotal = Number(total) || 0;
  const tiers = normalizeGiftHamperTiers(settings.giftHamperTiers);
  if (!tiers.length || orderTotal <= 0) {
    return null;
  }

  let matched = null;
  for (const tier of tiers) {
    if (orderTotal >= tier.minOrderAmount) {
      matched = tier;
    }
  }

  if (!matched) {
    return null;
  }

  return {
    minOrderAmount: matched.minOrderAmount,
    gift: { ...matched.gift },
    status: "pending",
    reviewedAt: null,
    adminNote: "",
  };
}

export const GIFT_HAMPER_STATUSES = ["pending", "approved", "rejected"];

export function getCustomerVisibleGiftHamper(giftHamper) {
  if (!giftHamper?.gift?.name) {
    return null;
  }

  const status = giftHamper.status || "pending";
  if (status !== "approved") {
    return null;
  }

  return {
    minOrderAmount: Number(giftHamper.minOrderAmount) || 0,
    status,
    gift: {
      name: String(giftHamper.gift.name || "").trim(),
      description: String(giftHamper.gift.description || "").trim(),
      image: String(giftHamper.gift.image || "").trim(),
    },
  };
}
