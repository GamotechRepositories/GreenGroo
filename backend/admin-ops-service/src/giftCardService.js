import { GiftCard } from "./models.js";

export function generateGiftCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `GG-${part()}-${part()}`;
}

function isExpired(card) {
  return Boolean(card.expiresAt && new Date(card.expiresAt) < new Date());
}

export async function previewGiftCard(code, payableAmount = 0) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) {
    return { error: "Gift card code is required" };
  }

  const card = await GiftCard.findOne({ code: normalized });
  if (!card) {
    return { error: "Gift card not found" };
  }
  if (card.status === "disabled") {
    return { error: "This gift card has been disabled" };
  }
  if (card.status === "redeemed" || Number(card.balance) <= 0) {
    return { error: "This gift card has no remaining balance" };
  }
  if (isExpired(card) || card.status === "expired") {
    if (card.status !== "expired") {
      card.status = "expired";
      await card.save();
    }
    return { error: "This gift card has expired" };
  }

  const payable = Math.max(0, Number(payableAmount) || 0);
  const discount = Math.min(Number(card.balance) || 0, payable || Number(card.balance) || 0);

  return {
    code: card.code,
    amount: card.amount,
    balance: card.balance,
    discountAmount: discount,
    expiresAt: card.expiresAt,
    status: card.status,
  };
}

export async function consumeGiftCard(code, amount, { orderId } = {}) {
  const normalized = String(code || "").trim().toUpperCase();
  const spend = Math.max(0, Number(amount) || 0);
  if (!normalized || spend <= 0) return null;

  const card = await GiftCard.findOne({ code: normalized });
  if (!card || card.status !== "active" || Number(card.balance) <= 0) return null;

  const applied = Math.min(Number(card.balance), spend);
  card.balance = Math.round((Number(card.balance) - applied) * 100) / 100;
  if (card.balance <= 0) {
    card.balance = 0;
    card.status = "redeemed";
    card.redeemedAt = new Date();
  }
  if (orderId) card.orderId = orderId;
  await card.save();
  return { code: card.code, applied, balance: card.balance, status: card.status };
}
