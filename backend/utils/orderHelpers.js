import Cart from "../models/Cart.js";
import Address from "../models/address/Address.js";
import Order from "../models/order/Order.js";
import Product from "../models/Product.js";
import User from "../models/user.js";
import {
  getAvailableColors,
  getUnitPriceForQuantity,
  getVariant,
  getVariantStock,
  isMultiVariant,
  PRODUCT_PRICING_SELECT,
} from "./productPricing.js";
import {
  calculateShippingCharge,
  getStoreSettings,
  meetsMinimumOrder,
} from "./storeSettingsHelpers.js";
import { calculateOrderTotal } from "./gstHelpers.js";
import { getRecordedAdvancePaidAmount } from "./paymentHelpers.js";
import { resolveCouponForCheckout } from "../controllers/couponController.js";
import { resolveGiftHamperForOrder, getCustomerVisibleGiftHamper } from "../../shared/store/giftHamper.js";

async function computeOrderPricing(subtotal, couponCode, options = {}) {
  const storeSettings = await getStoreSettings();
  let resolvedCouponCode = "";
  let couponDiscount = 0;

  if (couponCode) {
    const couponResult = await resolveCouponForCheckout(couponCode, subtotal, {
      userId: options.userId,
      excludeOrderId: options.excludeOrderId,
    });
    if (couponResult.error) {
      return {
        error: couponResult.error,
        status: 400,
        code: "INVALID_COUPON",
      };
    }
    resolvedCouponCode = couponResult.couponCode;
    couponDiscount = couponResult.couponDiscount;
  }

  const deliveryCharges = calculateShippingCharge(subtotal, storeSettings);
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const { gstAmount, total } = calculateOrderTotal(discountedSubtotal, deliveryCharges);

  return {
    storeSettings,
    deliveryCharges,
    gstAmount,
    total,
    couponCode: resolvedCouponCode,
    couponDiscount,
  };
}

const normalizeVariantName = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeColorName = (value) =>
  typeof value === "string" ? value.trim() : "";

const matchesOrderedItem = (cartItem, orderItem) => {
  const cartProductId = String(cartItem?.product?._id || cartItem?.product || "");
  const orderProductId = String(orderItem?.product?._id || orderItem?.product || "");

  return (
    cartProductId === orderProductId &&
    normalizeVariantName(cartItem.variantName) ===
      normalizeVariantName(orderItem.variantName) &&
    normalizeColorName(cartItem.colorName) === normalizeColorName(orderItem.colorName)
  );
};

export function resolveCheckoutMode(options = {}) {
  if (options.checkoutMode === "buyNow" || options.buyNow === true) {
    return "buyNow";
  }
  return "cart";
}

export function normalizeOrderMessage(body = {}) {
  const raw = body.customerMessage ?? body.message ?? body.customerNote ?? "";
  return typeof raw === "string" ? raw.trim().slice(0, 500) : "";
}

const populateCart = (query) =>
  query.populate({
    path: "items.product",
    select: PRODUCT_PRICING_SELECT,
  });

export const populateOrderItems = (query) =>
  query.populate({
    path: "items.product",
    select: "productImages",
  });

export function enrichOrderForResponse(
  order,
  { customerView = false, verifiedAdvancePayment = null } = {}
) {
  const doc = typeof order.toObject === "function" ? order.toObject() : { ...order };
  const giftHamper = customerView
    ? getCustomerVisibleGiftHamper(doc.giftHamper)
    : doc.giftHamper ?? null;
  const advancePaidAmount = getRecordedAdvancePaidAmount(doc, verifiedAdvancePayment);

  return {
    ...doc,
    advancePaidAmount,
    giftHamper,
    items: (doc.items || []).map((item) => {
      const productImages =
        item.product && typeof item.product === "object" ? item.product.productImages || [] : [];
      const productImage = productImages[0] || "";
      const storedImage = (item.image || "").trim();

      return {
        ...item,
        image: storedImage || productImage,
        productImage,
        product: item.product?._id || item.product,
      };
    }),
  };
}

export function addressToSnapshot(address) {
  const raw = typeof address.toObject === "function" ? address.toObject() : address;

  return {
    fullName: (raw.fullName || raw.name || "").trim(),
    number: String(raw.number || raw.phone || "").trim(),
    email: String(raw.email || "").trim().toLowerCase(),
    shopNo: (raw.shopNo || "").trim(),
    shopName: (raw.shopName || "").trim(),
    fullAddress: (raw.fullAddress || raw.streetArea || raw.landmark || "").trim(),
    landmark: (raw.landmark || "").trim(),
    city: (raw.city || "").trim(),
    state: (raw.state || "").trim(),
    pincode: String(raw.pincode || "").trim(),
  };
}

export function listUnavailableCartItems(items = []) {
  const unavailable = [];
  const available = [];

  for (const item of items) {
    if (!item?.product) {
      unavailable.push({
        productId: item?.product,
        name: "Unavailable product",
        reason: "missing",
      });
      continue;
    }

    if (item.product.isActive === false) {
      unavailable.push({
        productId: item.product._id,
        name: item.product.name || "Unavailable product",
        reason: "inactive",
      });
      continue;
    }

    available.push(item);
  }

  return { unavailable, available };
}

export async function pruneUnavailableCartItems(cart) {
  if (!cart?.items?.length) {
    return { removed: [], changed: false };
  }

  const { unavailable, available } = listUnavailableCartItems(cart.items);
  if (!unavailable.length) {
    return { removed: [], changed: false };
  }

  cart.items = available;
  await cart.save();
  return { removed: unavailable, changed: true };
}

async function resolveCheckoutItems(rawItems, { skipStockCheck = false } = {}) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "No items to checkout", status: 400 };
  }

  const resolved = [];

  for (const entry of rawItems) {
    const productId = entry.productId || entry._id;
    const normalizedVariantName = normalizeVariantName(entry.variantName);
    const normalizedColorName = normalizeColorName(entry.colorName);
    const qty = Number(entry.quantity);

    if (!productId || !Number.isFinite(qty) || qty < 1) {
      return { error: "Invalid checkout item", status: 400 };
    }

    const product = await Product.findById(productId).select(PRODUCT_PRICING_SELECT);
    if (!product || !product.isActive) {
      return {
        error: "One or more products are no longer available",
        status: 404,
      };
    }

    if (isMultiVariant(product)) {
      if (!normalizedVariantName) {
        return {
          error: "Variant selection is required for this product",
          status: 400,
        };
      }

      if (!getVariant(product, normalizedVariantName)) {
        return {
          error: "Selected variant is not available",
          status: 400,
        };
      }
    }

    const availableColors = getAvailableColors(product, normalizedVariantName);
    if (availableColors.length > 0) {
      if (!normalizedColorName) {
        return {
          error: "Color selection is required for this product",
          status: 400,
        };
      }

      const colorMatch = availableColors.some(
        (color) =>
          color.name?.trim().toLowerCase() === normalizedColorName.toLowerCase()
      );

      if (!colorMatch) {
        return {
          error: "Selected color is not available",
          status: 400,
        };
      }
    }

    const availableStock = getVariantStock(product, normalizedVariantName);
    if (!skipStockCheck && qty > availableStock) {
      return {
        error: `Only ${availableStock} units available in stock`,
        status: 400,
      };
    }

    resolved.push({
      product,
      quantity: qty,
      variantName: normalizedVariantName,
      colorName: normalizedColorName,
    });
  }

  return { items: resolved };
}

function buildOrderItemsFromResolved(items) {
  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    if (!item.product || item.product.isActive === false) {
      return {
        error: "One or more products are no longer available",
        status: 400,
        code: "CART_ITEMS_UNAVAILABLE",
      };
    }

    const variantName = item.variantName || "";
    const colorName = item.colorName || "";
    const price = getUnitPriceForQuantity(item.product, item.quantity, variantName);
    subtotal += price * item.quantity;

    orderItems.push({
      product: item.product._id,
      name: item.product.name,
      brandName: item.product.brandName || "",
      variantName,
      colorName,
      price,
      quantity: item.quantity,
      image: item.product.productImages?.[0] || "",
    });
  }

  return { orderItems, subtotal };
}

export async function prepareOrderData(userId, addressId, options = {}) {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    return { error: "Address not found", status: 404 };
  }

  const checkoutMode = resolveCheckoutMode(options);
  let itemsToProcess = [];
  let cart = null;

  if (checkoutMode === "buyNow") {
    const resolved = await resolveCheckoutItems(options.checkoutItems);
    if (resolved.error) {
      return { error: resolved.error, status: resolved.status };
    }
    itemsToProcess = resolved.items;
    cart = await populateCart(Cart.findOne({ user: userId }));
  } else {
    cart = await populateCart(Cart.findOne({ user: userId }));
    if (!cart?.items?.length) {
      return { error: "Your cart is empty", status: 400 };
    }

    const { removed } = await pruneUnavailableCartItems(cart);
    if (removed.length) {
      const names = removed.map((item) => item.name).join(", ");
      return {
        error: `These items are no longer available: ${names}. They were removed from your cart. Please review and try again.`,
        status: 400,
        code: "CART_ITEMS_UNAVAILABLE",
        removedItems: removed,
      };
    }

    if (!cart.items.length) {
      return { error: "Your cart is empty", status: 400 };
    }

    itemsToProcess = cart.items;
  }

  const built = buildOrderItemsFromResolved(itemsToProcess);
  if (built.error) {
    return built;
  }

  const { orderItems, subtotal } = built;

  const pricing = await computeOrderPricing(subtotal, options.couponCode, {
    userId,
  });
  if (pricing.error) {
    return pricing;
  }

  const { storeSettings, deliveryCharges, gstAmount, total, couponCode, couponDiscount } =
    pricing;

  if (!meetsMinimumOrder(subtotal, storeSettings)) {
    return {
      error: `Minimum order value is ₹${storeSettings.minimumOrderValue}. Please add more items to your cart.`,
      status: 400,
      code: "MINIMUM_ORDER_NOT_MET",
      minimumOrderValue: storeSettings.minimumOrderValue,
    };
  }

  const deliveryAddress = addressToSnapshot(address);
  const requiredSnapshotFields = [
    "fullName",
    "number",
    "email",
    "shopNo",
    "shopName",
    "fullAddress",
    "landmark",
    "city",
    "state",
    "pincode",
  ];
  const hasCompleteAddress = requiredSnapshotFields.every((field) => deliveryAddress[field]);

  if (!hasCompleteAddress) {
    return {
      error:
        "Delivery address is incomplete. Please edit or re-add your address before placing the order.",
      status: 400,
    };
  }

  return {
    orderItems,
    deliveryAddress,
    subtotal,
    couponCode,
    couponDiscount,
    deliveryCharges,
    gstAmount,
    total,
    cart,
    checkoutMode,
  };
}

export async function rebuildOrderFromItemsInput(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "Order must have at least one item", status: 400 };
  }

  const resolved = await resolveCheckoutItems(rawItems, { skipStockCheck: true });
  if (resolved.error) {
    return resolved;
  }

  const built = buildOrderItemsFromResolved(resolved.items);
  if (built.error) {
    return built;
  }

  const storeSettings = await getStoreSettings();
  const deliveryCharges = calculateShippingCharge(built.subtotal, storeSettings);
  const { gstAmount, total } = calculateOrderTotal(built.subtotal, deliveryCharges);

  return {
    orderItems: built.orderItems,
    subtotal: built.subtotal,
    deliveryCharges,
    gstAmount,
    total,
  };
}

function buildPendingDeliveryAddress(user, address = null) {
  if (address) {
    const snapshot = addressToSnapshot(address);
    const fields = [
      "fullName",
      "number",
      "email",
      "shopNo",
      "shopName",
      "fullAddress",
      "landmark",
      "city",
      "state",
      "pincode",
    ];
    if (fields.every((field) => snapshot[field])) {
      return snapshot;
    }
  }

  const rawPhone = String(user?.phone || "").trim();
  const phone = /^[6789]\d{9}$/.test(rawPhone) ? rawPhone : "6000000000";
  const rawEmail = String(user?.email || "").trim().toLowerCase();
  const email = /^\S+@\S+\.\S+$/.test(rawEmail) ? rawEmail : "customer@example.com";

  return {
    fullName: (user?.name || "Customer").trim(),
    number: phone,
    email,
    shopNo: "Pending",
    shopName: "Checkout in progress",
    fullAddress: "Address to be confirmed",
    landmark: "Pending",
    city: "Pending",
    state: "Pending",
    pincode: "110001",
  };
}

async function resolveItemsForCheckout(userId, options = {}) {
  const checkoutMode = resolveCheckoutMode(options);
  let itemsToProcess = [];
  let cart = null;

  if (checkoutMode === "buyNow") {
    const resolved = await resolveCheckoutItems(options.checkoutItems, {
      skipStockCheck: Boolean(options.skipStockCheck),
    });
    if (resolved.error) {
      return resolved;
    }
    itemsToProcess = resolved.items;
    cart = await populateCart(Cart.findOne({ user: userId }));
  } else {
    cart = await populateCart(Cart.findOne({ user: userId }));
    if (!cart?.items?.length) {
      return { error: "Your cart is empty", status: 400 };
    }

    const { unavailable, available } = listUnavailableCartItems(cart.items);
    if (unavailable.length && !available.length) {
      const names = unavailable.map((item) => item.name).join(", ");
      return {
        error: `These items are no longer available: ${names}`,
        status: 400,
        code: "CART_ITEMS_UNAVAILABLE",
        removedItems: unavailable,
      };
    }

    itemsToProcess = available.length ? available : cart.items;
  }

  return { itemsToProcess, cart, checkoutMode };
}

export async function prepareCheckoutAttemptData(userId, options = {}) {
  const user = await User.findById(userId);
  if (!user) {
    return { error: "User not found", status: 404 };
  }

  let address = null;
  if (options.addressId) {
    address = await Address.findOne({ _id: options.addressId, user: userId });
  } else {
    address =
      (await Address.findOne({ user: userId, isDefault: true })) ||
      (await Address.findOne({ user: userId }).sort({ updatedAt: -1 }));
  }

  const resolvedItems = await resolveItemsForCheckout(userId, {
    ...options,
    skipStockCheck: true,
  });
  if (resolvedItems.error) {
    return resolvedItems;
  }

  const { itemsToProcess, cart, checkoutMode } = resolvedItems;
  const built = buildOrderItemsFromResolved(itemsToProcess);
  if (built.error) {
    return built;
  }

  const { orderItems, subtotal } = built;

  const attemptedOrder = await Order.findOne({ user: userId, status: "attempted" })
    .sort({ updatedAt: -1 })
    .select("_id")
    .lean();

  const pricing = await computeOrderPricing(subtotal, options.couponCode, {
    userId,
    excludeOrderId: attemptedOrder?._id,
  });
  if (pricing.error) {
    return pricing;
  }

  const { deliveryCharges, gstAmount, total, couponCode, couponDiscount } = pricing;

  return {
    orderItems,
    deliveryAddress: buildPendingDeliveryAddress(user, address),
    subtotal,
    couponCode,
    couponDiscount,
    deliveryCharges,
    gstAmount,
    total,
    cart,
    checkoutMode,
  };
}

export async function upsertCheckoutAttemptOrder(userId, prepared, paymentMethod = "cod") {
  const normalizedPaymentMethod = paymentMethod === "online" ? "online" : "cod";
  const payload = {
    items: prepared.orderItems,
    deliveryAddress: prepared.deliveryAddress,
    subtotal: prepared.subtotal,
    couponCode: prepared.couponCode || "",
    couponDiscount: prepared.couponDiscount || 0,
    deliveryCharges: prepared.deliveryCharges,
    gstAmount: prepared.gstAmount ?? 0,
    total: prepared.total,
    paymentMethod: normalizedPaymentMethod,
    paymentStatus: "unpaid",
    status: "attempted",
  };

  let order = await Order.findOne({ user: userId, status: "attempted" }).sort({
    updatedAt: -1,
  });

  if (order) {
    Object.assign(order, payload);
    await order.save();
    return order;
  }

  order = await Order.create({
    user: userId,
    ...payload,
  });

  await User.findByIdAndUpdate(userId, {
    $addToSet: { orders: order._id },
  });

  return order;
}

async function clearCartAfterCheckout(cart, checkoutMode, orderItems, userId) {
  if (checkoutMode === "cart") {
    if (cart) {
      cart.items = [];
      await cart.save();
      return;
    }

    if (userId) {
      await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
    }
    return;
  }

  if (!cart) return;

  cart.items = cart.items.filter(
    (item) => !orderItems.some((ordered) => matchesOrderedItem(item, ordered))
  );

  await cart.save();
}

export async function findAttemptedOrderForCheckout(userId, attemptedOrderId) {
  if (attemptedOrderId) {
    const explicit = await Order.findOne({
      _id: attemptedOrderId,
      user: userId,
    });
    if (explicit) {
      return explicit;
    }
  }

  return Order.findOne({ user: userId, status: "attempted" }).sort({ updatedAt: -1 });
}

async function resolveGiftHamperSnapshot(total) {
  const storeSettings = await getStoreSettings();
  return resolveGiftHamperForOrder(total, storeSettings);
}

export async function completeAttemptedOrder({
  attemptedOrderId,
  userId,
  orderItems,
  deliveryAddress,
  subtotal,
  couponCode = "",
  couponDiscount = 0,
  deliveryCharges,
  gstAmount = 0,
  total,
  cart,
  checkoutMode = "cart",
  paymentMethod,
  paymentStatus,
  status = "confirm",
  razorpayOrderId,
  razorpayPaymentId,
  codAdvanceAmount = 0,
  codAdvanceRazorpayPaymentId = "",
  razorpayPaidAmount = 0,
  codAdvancePaidAt = null,
  paidAt,
  message = "",
}) {
  const order = await findAttemptedOrderForCheckout(userId, attemptedOrderId);

  if (!order) {
    return null;
  }

  if (order.status !== "attempted") {
    await clearCartAfterCheckout(cart, checkoutMode, orderItems, userId);
    return order;
  }

  const orderMessage =
    typeof message === "string" ? message.trim().slice(0, 500) : "";

  order.items = orderItems;
  order.deliveryAddress = deliveryAddress;
  order.subtotal = subtotal;
  order.couponCode = couponCode || "";
  order.couponDiscount = couponDiscount > 0 ? couponDiscount : 0;
  order.deliveryCharges = deliveryCharges;
  order.gstAmount = gstAmount > 0 ? gstAmount : 0;
  order.total = total;
  order.paymentMethod = paymentMethod;
  order.paymentStatus = paymentStatus;
  order.status = status;
  order.message = orderMessage;
  order.razorpayOrderId = razorpayOrderId || "";
  order.razorpayPaymentId = razorpayPaymentId || "";
  order.codAdvanceAmount = codAdvanceAmount > 0 ? codAdvanceAmount : 0;
  order.razorpayPaidAmount = razorpayPaidAmount > 0 ? razorpayPaidAmount : 0;
  order.codAdvanceRazorpayPaymentId = codAdvanceRazorpayPaymentId || "";
  order.codAdvancePaidAt = codAdvancePaidAt || null;
  order.paidAt = paidAt || null;

  if (status !== "attempted") {
    order.createdAt = new Date();
    order.giftHamper = await resolveGiftHamperSnapshot(total);
  }

  await order.save();
  await clearCartAfterCheckout(cart, checkoutMode, orderItems, userId);

  return order;
}

export async function finalizeOrder({
  userId,
  orderItems,
  deliveryAddress,
  subtotal,
  couponCode = "",
  couponDiscount = 0,
  deliveryCharges,
  gstAmount = 0,
  total,
  cart,
  checkoutMode = "cart",
  paymentMethod,
  paymentStatus,
  status = "confirm",
  razorpayOrderId,
  razorpayPaymentId,
  codAdvanceAmount = 0,
  codAdvanceRazorpayPaymentId = "",
  razorpayPaidAmount = 0,
  codAdvancePaidAt = null,
  paidAt,
  message = "",
  attemptedOrderId,
}) {
  const completed = await completeAttemptedOrder({
    attemptedOrderId,
    userId,
    orderItems,
    deliveryAddress,
    subtotal,
    couponCode,
    couponDiscount,
    deliveryCharges,
    gstAmount,
    total,
    cart,
    checkoutMode,
    paymentMethod,
    paymentStatus,
    status,
    razorpayOrderId,
    razorpayPaymentId,
    codAdvanceAmount,
    codAdvanceRazorpayPaymentId,
    razorpayPaidAmount,
    codAdvancePaidAt,
    paidAt,
    message,
  });

  if (completed) {
    return completed;
  }

  const orderMessage =
    typeof message === "string" ? message.trim().slice(0, 500) : "";

  const giftHamper = await resolveGiftHamperSnapshot(total);

  const order = await Order.create({
    user: userId,
    items: orderItems,
    deliveryAddress,
    paymentMethod,
    subtotal,
    couponCode: couponCode || "",
    couponDiscount: couponDiscount > 0 ? couponDiscount : 0,
    deliveryCharges,
    gstAmount: gstAmount > 0 ? gstAmount : 0,
    total,
    status,
    paymentStatus,
    message: orderMessage,
    ...(giftHamper ? { giftHamper } : {}),
    ...(razorpayOrderId && { razorpayOrderId }),
    ...(razorpayPaymentId && { razorpayPaymentId }),
    ...(codAdvanceAmount > 0 && { codAdvanceAmount }),
    ...(razorpayPaidAmount > 0 && { razorpayPaidAmount }),
    ...(codAdvanceRazorpayPaymentId && { codAdvanceRazorpayPaymentId }),
    ...(codAdvancePaidAt && { codAdvancePaidAt }),
    ...(paidAt && { paidAt }),
  });

  await User.findByIdAndUpdate(userId, {
    $addToSet: { orders: order._id },
  });

  await clearCartAfterCheckout(cart, checkoutMode, orderItems, userId);

  return order;
}
