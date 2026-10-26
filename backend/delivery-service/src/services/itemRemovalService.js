import EcommerceOrder from "../../../legacy/models/order/Order.js";
import StoreOrder from "../models/StoreOrder.js";
import { sendItemsUnavailable } from "../../../legacy/services/notificationService.js";

const lineValue = (item) => Number(item.price || 0) * Number(item.quantity || 0);

/** Share of the list price the customer actually paid for goods (after coupons / discounts). */
function paidRatio(customerOrder) {
  if (!customerOrder) return 1;
  const listValue = (customerOrder.items || []).reduce((sum, item) => sum + lineValue(item), 0);
  const goodsPaid =
    Number(customerOrder.total || 0) -
    Number(customerOrder.deliveryCharges || 0) -
    Number(customerOrder.heavyHandlingFee || 0);
  if (listValue <= 0 || goodsPaid <= 0) return 1;
  return Math.min(1, goodsPaid / listValue);
}

async function hasOpenSibling(storeOrder) {
  if (!storeOrder.sourceOrderId) return false;
  return StoreOrder.exists({
    sourceOrderId: storeOrder.sourceOrderId,
    _id: { $ne: storeOrder._id },
    status: { $ne: "cancelled" },
  });
}

function matchCustomerLine(customerOrder, item) {
  const lines = customerOrder.items || [];
  if (item.productId) {
    const byProduct = lines.find((line) => String(line.product) === String(item.productId));
    if (byProduct) return byProduct;
  }
  const name = String(item.name || "").trim().toLowerCase();
  return lines.find((line) => String(line.name || "").trim().toLowerCase() === name) || null;
}

/**
 * The store cannot supply `item`: take its billed share off this part and the customer
 * order, owe back anything already paid, and tell the customer. The line stays on the
 * store order (flagged customerInformed) until packing drops it.
 *
 * When it was the last line of the whole customer order, nothing is adjusted here —
 * `emptied` is returned and the caller cancels, which refunds the full order.
 */
export async function removeUnavailableItem(storeOrder, item) {
  const now = new Date();
  const openLines = storeOrder.items.filter((line) => !line.customerInformed && !line._id.equals(item._id));
  const customerOrder = storeOrder.sourceOrderId
    ? await EcommerceOrder.findById(storeOrder.sourceOrderId)
    : null;

  item.customerInformed = true;
  item.customerInformedAt = now;

  if (!openLines.length && !(await hasOpenSibling(storeOrder))) {
    return { emptied: true, amount: 0, refund: 0, customerOrder };
  }

  const billed = Number(storeOrder.partTotal || 0) || Number(storeOrder.amountToCollect || 0);
  const amount = openLines.length
    ? Math.min(billed, Math.round(lineValue(item) * paidRatio(customerOrder)))
    : billed;
  const paidOnline = storeOrder.paymentStatus === "paid_online";

  storeOrder.removedItems.push({
    productId: item.productId || null,
    sku: item.sku,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    amount,
    removedAt: now,
  });
  storeOrder.partTotal = Math.max(0, billed - amount);
  if (paidOnline) {
    storeOrder.refundDue = Number(storeOrder.refundDue || 0) + amount;
    if (amount > 0) storeOrder.refundStatus = "pending";
  } else {
    storeOrder.amountToCollect = Math.max(0, Number(storeOrder.amountToCollect || 0) - amount);
  }

  if (customerOrder) {
    const line = matchCustomerLine(customerOrder, item);
    if (line) {
      if (line.quantity > item.quantity) line.quantity -= item.quantity;
      else if (customerOrder.items.length > 1) customerOrder.items.pull(line._id);
    }
    customerOrder.subtotal = Math.max(0, Math.round(Number(customerOrder.subtotal || 0) - lineValue(item)));
    customerOrder.total = Math.max(0, Math.round(Number(customerOrder.total || 0) - amount));
    if (paidOnline && amount > 0) {
      customerOrder.refunds.push({
        amount,
        reason: `Out of stock at the dark store: ${item.name}`,
        items: [{ name: item.name, quantity: item.quantity, amount }],
        storeOrderId: storeOrder._id,
      });
    }
    await customerOrder.save();

    void sendItemsUnavailable(customerOrder, {
      items: [item],
      refundAmount: paidOnline ? amount : 0,
      amountDue: paidOnline ? null : Math.round(Number(customerOrder.total || 0)),
    }).catch((err) => console.warn("[itemRemoval] notify failed:", err.message));
  }

  return { emptied: !openLines.length, amount, refund: paidOnline ? amount : 0, customerOrder };
}

/** Packing: drop the lines the customer was told about. Money was settled when they were informed. */
export function dropInformedItems(storeOrder) {
  const ids = storeOrder.items.filter((line) => line.customerInformed).map((line) => line._id);
  ids.forEach((id) => storeOrder.items.pull(id));
  return ids.length;
}
