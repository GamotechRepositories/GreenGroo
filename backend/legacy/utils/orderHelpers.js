import crypto from "crypto";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Address from "../models/address/Address.js";
import Order from "../models/order/Order.js";
import Product from "../models/Product.js";
import User from "../models/user.js";
import { isLocalProductId } from "./localProductId.js";
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
import { geocodeAddressString } from "../services/reverseGeocodeService.js";
import {
  getRewardSettings,
  calculateEligibleRewardDiscount,
  calculatePointsToEarn,
  processOrderRewardPoints,
} from "../controllers/rewardController.js";
import { resolveGiftHamperForOrder, getCustomerVisibleGiftHamper } from "../../../shared/store/giftHamper.js";
import { dispatchDeliveryOrder } from "../services/deliveryDispatcher.js";
import { previewGiftCard, consumeGiftCard } from "../../admin-ops-service/src/giftCardService.js";

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

  let rewardPointsUsed = 0;
  let rewardDiscount = 0;

  if (options.rewardPointsToUse && options.userId) {
    const rewardSettings = await getRewardSettings();
    const user = await User.findById(options.userId).select("rewardPoints");
    const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
    const rewardResult = calculateEligibleRewardDiscount(
      user?.rewardPoints || 0,
      options.rewardPointsToUse,
      subtotalAfterCoupon,
      rewardSettings
    );
    if (!rewardResult.valid) {
      return {
        error: rewardResult.reason || "Invalid reward points redemption",
        status: 400,
        code: "INVALID_REWARD_POINTS",
      };
    }
    rewardPointsUsed = rewardResult.pointsToUse;
    rewardDiscount = rewardResult.discount;
  }

  let giftCardCode = "";
  let giftCardDiscount = 0;
  if (options.giftCardCode) {
    const payableAfterOffers = Math.max(0, subtotal - couponDiscount - rewardDiscount);
    const giftResult = await previewGiftCard(options.giftCardCode, payableAfterOffers);
    if (giftResult.error) {
      return {
        error: giftResult.error,
        status: 400,
        code: "INVALID_GIFT_CARD",
      };
    }
    giftCardCode = giftResult.code;
    giftCardDiscount = giftResult.discountAmount;
  }

  const deliveryCharges = calculateShippingCharge(subtotal, storeSettings);
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount - rewardDiscount - giftCardDiscount);
  const { gstAmount, total } = calculateOrderTotal(discountedSubtotal, deliveryCharges);

  const rewardSettings = await getRewardSettings();
  const rewardPointsEarned = calculatePointsToEarn(subtotal, rewardSettings);

  return {
    storeSettings,
    deliveryCharges,
    gstAmount,
    total,
    couponCode: resolvedCouponCode,
    couponDiscount,
    rewardPointsUsed,
    rewardDiscount,
    rewardPointsEarned,
    giftCardCode,
    giftCardDiscount,
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
    deliveryOtp: doc.deliveryOtp || "",
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

/**
 * Attach delivery OTP from StoreOrder for customer-facing responses.
 * Backfills older orders that only have otpCode on StoreOrder.
 */
export async function attachCustomerDeliveryOtps(enriched) {
  const list = Array.isArray(enriched) ? enriched : [enriched];
  const missing = list.filter((o) => o && !o.deliveryOtp && o._id);
  if (missing.length) {
    try {
      const StoreOrder = (await import("../../delivery-service/src/models/StoreOrder.js")).default;
      const storeOrders = await StoreOrder.find({
        sourceOrderId: { $in: missing.map((o) => o._id) },
      })
        .select("sourceOrderId otpCode")
        .lean();
      const bySource = new Map(
        storeOrders.map((s) => [String(s.sourceOrderId), String(s.otpCode || "").trim()])
      );
      for (const order of list) {
        if (!order?.deliveryOtp && order?._id) {
          const otp = bySource.get(String(order._id));
          if (otp) order.deliveryOtp = otp;
        }
      }
    } catch (err) {
      console.warn("[attachCustomerDeliveryOtps]", err.message);
    }
  }
  return Array.isArray(enriched) ? list : list[0];
}

function toCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function coordsFromSource(source = {}) {
  const lat = toCoord(
    source.location?.lat ?? source.lat ?? source.latitude
  );
  const lng = toCoord(
    source.location?.lng ?? source.lng ?? source.longitude
  );
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function mergeCustomerLocation(snapshot, customerLocation) {
  if (!snapshot) return snapshot;
  const next = { ...snapshot };

  if (customerLocation && typeof customerLocation === "object") {
    if (customerLocation.address || customerLocation.fullAddress) {
      const addrStr = String(customerLocation.address || customerLocation.fullAddress).trim();
      if (addrStr.length > 0 && addrStr !== "Main Address" && addrStr !== "Address to be confirmed") {
        next.fullAddress = addrStr;
      }
    }
    if (customerLocation.area) {
      const areaStr = String(customerLocation.area).trim();
      if (areaStr.length > 0 && areaStr !== "Near Location") {
        next.area = areaStr;
        if (!next.landmark || next.landmark === "Near Location") {
          next.landmark = areaStr;
        }
      }
    }
    if (customerLocation.city) {
      const cityStr = String(customerLocation.city).trim();
      if (cityStr.length > 0 && cityStr !== "City") {
        next.city = cityStr;
      }
    }
    if (customerLocation.state) {
      const stateStr = String(customerLocation.state).trim();
      if (stateStr.length > 0 && stateStr !== "State") {
        next.state = stateStr;
      }
    }
    if (customerLocation.pincode) {
      const pinStr = String(customerLocation.pincode).trim();
      if (pinStr.length > 0 && pinStr !== "110001") {
        next.pincode = pinStr;
      }
    }
    if (customerLocation.lat && customerLocation.lng) {
      next.location = { lat: customerLocation.lat, lng: customerLocation.lng };
    }
  }

  return next;
}

export function addressToSnapshot(address, customerLocation) {
  const raw = typeof address.toObject === "function" ? address.toObject() : address;
  const coords = coordsFromSource(raw);

  const snapshot = {
    fullName: (raw.fullName || raw.name || "Customer").trim(),
    number: String(raw.number || raw.phone || "9876543210").trim(),
    email: String(raw.email || "customer@greengrocc.com").trim().toLowerCase(),
    shopNo: (raw.shopNo || "Main").trim(),
    shopName: (raw.shopName || "Home/Work").trim(),
    fullAddress: (raw.fullAddress || raw.streetArea || raw.landmark || "Main Address").trim(),
    landmark: (raw.landmark || raw.area || "Near Location").trim(),
    city: (raw.city || "City").trim(),
    state: (raw.state || "State").trim(),
    pincode: String(raw.pincode || "110001").trim(),
    area: (raw.area || raw.landmark || "Near Location").trim(),
    ...(coords ? { location: coords } : {}),
  };

  return mergeCustomerLocation(snapshot, customerLocation);
}

function formatSnapshotForGeocode(snapshot = {}) {
  return [
    snapshot.shopNo,
    snapshot.shopName,
    snapshot.fullAddress,
    snapshot.landmark,
    snapshot.area,
    snapshot.city,
    snapshot.state,
    snapshot.pincode,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

export async function ensureDeliveryAddressCoords(deliveryAddress) {
  if (!deliveryAddress) return deliveryAddress;
  if (coordsFromSource(deliveryAddress)) return deliveryAddress;

  const query = formatSnapshotForGeocode(deliveryAddress);
  if (!query) return deliveryAddress;

  const geocoded = await geocodeAddressString(query);
  if (!geocoded) return deliveryAddress;

  return {
    ...deliveryAddress,
    location: geocoded,
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

function localCatalogProductId(localId) {
  const hash = crypto.createHash("md5").update(String(localId)).digest("hex").slice(0, 24);
  return new mongoose.Types.ObjectId(hash);
}

function buildCatalogProductFromEntry(entry) {
  const localId = entry.productId || entry._id;
  const unitPrice = Number(entry.discountedPrice ?? entry.price);
  const name = String(entry.name || "").trim();

  if (!localId || !name || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return null;
  }

  const images = Array.isArray(entry.productImages)
    ? entry.productImages.filter(Boolean)
    : entry.image
      ? [entry.image]
      : [];

  return {
    _id: localCatalogProductId(localId),
    name,
    brandName: String(entry.brandName || "").trim(),
    price: Number(entry.price ?? unitPrice),
    discountedPrice: unitPrice,
    isActive: true,
    inStock: true,
    stock: 9999,
    productImages: images,
  };
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

    let product = null;

    if (isLocalProductId(productId)) {
      product = buildCatalogProductFromEntry(entry);
      if (!product) {
        return { error: "Invalid checkout item", status: 400 };
      }
    } else {
      try {
        product = await Product.findById(productId).select(PRODUCT_PRICING_SELECT);
      } catch (_) {
        product = null;
      }
      if (!product || !product.isActive) {
        product = buildCatalogProductFromEntry(entry);
        if (!product) {
          return {
            error: "One or more products are no longer available",
            status: 404,
          };
        }
      }
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
  const user = await User.findById(userId);
  if (!user) {
    return { error: "User not found", status: 404 };
  }

  let address = null;
  const isDummyAddress = (id) =>
    !id || id === "default_address" || id === "defult_address" || !mongoose.Types.ObjectId.isValid(id);

  if (!isDummyAddress(addressId)) {
    try {
      address = await Address.findOne({ _id: addressId, user: userId });
    } catch (_) {
      address = null;
    }
  }

  if (!address) {
    try {
      address =
        (await Address.findOne({ user: userId, isDefault: true })) ||
        (await Address.findOne({ user: userId }));
    } catch (_) {
      address = null;
    }
  }

  if (!address) {
    const rawPhone = String(user.phone || "").trim().replace(/\D/g, "").slice(-10);
    const phone = /^[6789]\d{9}$/.test(rawPhone) ? rawPhone : "9876543210";
    const rawEmail = String(user.email || "").trim().toLowerCase();
    const email = /^\S+@\S+\.\S+$/.test(rawEmail)
      ? rawEmail
      : `user_${userId.toString().slice(-6)}@greengrocc.com`;
    const custLoc = options.customerLocation || {};

    try {
      address = await Address.create({
        user: userId,
        fullName: (user.name || "Customer").trim(),
        number: phone,
        email: email,
        shopNo: custLoc.shopNo || "Main",
        shopName: custLoc.shopName || "Home/Work",
        fullAddress: custLoc.fullAddress || custLoc.address || "Main Street",
        landmark: custLoc.landmark || custLoc.area || "Near Location",
        city: custLoc.city || "City",
        state: custLoc.state || "State",
        pincode:
          custLoc.pincode && /^\d{6}$/.test(custLoc.pincode)
            ? custLoc.pincode
            : "110001",
        area: custLoc.area || "",
        isDefault: true,
      });
    } catch (e) {
      console.warn("Failed to auto-create address for user:", e.message);
    }
  }

  const resolvedItems = await resolveItemsForCheckout(userId, options);
  if (resolvedItems.error) {
    return resolvedItems;
  }

  const { itemsToProcess, cart, checkoutMode } = resolvedItems;

  const built = buildOrderItemsFromResolved(itemsToProcess);
  if (built.error) {
    return built;
  }

  const { orderItems, subtotal } = built;

  const pricing = await computeOrderPricing(subtotal, options.couponCode, {
    userId,
    rewardPointsToUse: options.rewardPointsToUse,
    giftCardCode: options.giftCardCode,
  });
  if (pricing.error) {
    return pricing;
  }

  const {
    storeSettings,
    deliveryCharges,
    gstAmount,
    total,
    couponCode,
    couponDiscount,
    rewardPointsUsed,
    rewardDiscount,
    rewardPointsEarned,
    giftCardCode,
    giftCardDiscount,
  } = pricing;

  if (!meetsMinimumOrder(subtotal, storeSettings)) {
    return {
      error: `Minimum order value is ₹${storeSettings.minimumOrderValue}. Please add more items to your cart.`,
      status: 400,
      code: "MINIMUM_ORDER_NOT_MET",
      minimumOrderValue: storeSettings.minimumOrderValue,
    };
  }

  let deliveryAddress;
  if (address) {
    deliveryAddress = await ensureDeliveryAddressCoords(
      addressToSnapshot(address, options.customerLocation)
    );
  } else {
    deliveryAddress = buildPendingDeliveryAddress(user, null);
  }

  const rawPhone = String(user.phone || "").trim().replace(/\D/g, "").slice(-10);
  const fallbackPhone = /^[6789]\d{9}$/.test(rawPhone) ? rawPhone : "9876543210";
  const rawEmail = String(user.email || "").trim().toLowerCase();
  const fallbackEmail = /^\S+@\S+\.\S+$/.test(rawEmail)
    ? rawEmail
    : `user_${userId.toString().slice(-6)}@greengrocc.com`;

  deliveryAddress.fullName = (deliveryAddress.fullName || user.name || "Customer").trim();
  deliveryAddress.number = (deliveryAddress.number || fallbackPhone).trim();
  deliveryAddress.email = (deliveryAddress.email || fallbackEmail).trim();
  deliveryAddress.shopNo = (deliveryAddress.shopNo && deliveryAddress.shopNo !== "Main" ? deliveryAddress.shopNo : "").trim();
  deliveryAddress.shopName = (deliveryAddress.shopName && deliveryAddress.shopName !== "Home/Work" ? deliveryAddress.shopName : "").trim();
  deliveryAddress.fullAddress = (
    deliveryAddress.fullAddress ||
    options.customerLocation?.address ||
    options.customerLocation?.fullAddress ||
    ""
  ).trim();
  deliveryAddress.landmark = (
    deliveryAddress.landmark && deliveryAddress.landmark !== "Near Location"
      ? deliveryAddress.landmark
      : (options.customerLocation?.area || "")
  ).trim();
  deliveryAddress.city = (
    deliveryAddress.city && deliveryAddress.city !== "City"
      ? deliveryAddress.city
      : (options.customerLocation?.city || "")
  ).trim();
  deliveryAddress.state = (
    deliveryAddress.state && deliveryAddress.state !== "State"
      ? deliveryAddress.state
      : (options.customerLocation?.state || "")
  ).trim();
  deliveryAddress.pincode = (
    deliveryAddress.pincode && deliveryAddress.pincode !== "110001"
      ? deliveryAddress.pincode
      : (options.customerLocation?.pincode || "")
  ).trim();

  return {
    orderItems,
    deliveryAddress,
    subtotal,
    couponCode,
    couponDiscount,
    rewardPointsUsed: rewardPointsUsed || 0,
    rewardDiscount: rewardDiscount || 0,
    rewardPointsEarned: rewardPointsEarned || 0,
    giftCardCode: giftCardCode || "",
    giftCardDiscount: giftCardDiscount || 0,
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
  const clientItems = Array.isArray(options.checkoutItems) ? options.checkoutItems : [];
  const cart = await populateCart(Cart.findOne({ user: userId }));

  if (checkoutMode === "buyNow" || clientItems.length > 0) {
    const resolved = await resolveCheckoutItems(clientItems, {
      skipStockCheck: Boolean(options.skipStockCheck),
    });
    if (resolved.error) {
      return resolved;
    }
    return {
      itemsToProcess: resolved.items,
      cart,
      checkoutMode,
    };
  }

  if (!cart?.items?.length) {
    return { error: "Your cart is empty", status: 400 };
  }

  if (!options.skipStockCheck) {
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

    return { itemsToProcess: cart.items, cart, checkoutMode };
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

  const itemsToProcess = available.length ? available : cart.items;
  return { itemsToProcess, cart, checkoutMode };
}

export async function prepareCheckoutAttemptData(userId, options = {}) {
  const user = await User.findById(userId);
  if (!user) {
    return { error: "User not found", status: 404 };
  }

  let address = null;
  const isDummyAddress = (id) =>
    !id || id === "default_address" || id === "defult_address" || !mongoose.Types.ObjectId.isValid(id);

  if (!isDummyAddress(options.addressId)) {
    try {
      address = await Address.findOne({ _id: options.addressId, user: userId });
    } catch (_) {
      address = null;
    }
  }

  if (!address) {
    try {
      address =
        (await Address.findOne({ user: userId, isDefault: true })) ||
        (await Address.findOne({ user: userId }).sort({ updatedAt: -1 }));
    } catch (_) {
      address = null;
    }
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
    rewardPointsToUse: options.rewardPointsToUse,
    giftCardCode: options.giftCardCode,
  });
  if (pricing.error) {
    return pricing;
  }

  const {
    deliveryCharges,
    gstAmount,
    total,
    couponCode,
    couponDiscount,
    rewardPointsUsed,
    rewardDiscount,
    rewardPointsEarned,
    giftCardCode,
    giftCardDiscount,
  } = pricing;

  return {
    orderItems,
    deliveryAddress: mergeCustomerLocation(
      buildPendingDeliveryAddress(user, address),
      options.customerLocation
    ),
    subtotal,
    couponCode,
    couponDiscount,
    rewardPointsUsed: rewardPointsUsed || 0,
    rewardDiscount: rewardDiscount || 0,
    rewardPointsEarned: rewardPointsEarned || 0,
    giftCardCode: giftCardCode || "",
    giftCardDiscount: giftCardDiscount || 0,
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
    rewardPointsUsed: prepared.rewardPointsUsed || 0,
    rewardDiscount: prepared.rewardDiscount || 0,
    rewardPointsEarned: prepared.rewardPointsEarned || 0,
    giftCardCode: prepared.giftCardCode || "",
    giftCardDiscount: prepared.giftCardDiscount || 0,
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
  rewardPointsUsed = 0,
  rewardDiscount = 0,
  rewardPointsEarned = 0,
  giftCardCode = "",
  giftCardDiscount = 0,
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
  order.rewardPointsUsed = rewardPointsUsed > 0 ? rewardPointsUsed : 0;
  order.rewardDiscount = rewardDiscount > 0 ? rewardDiscount : 0;
  order.rewardPointsEarned = rewardPointsEarned > 0 ? rewardPointsEarned : 0;
  order.giftCardCode = giftCardCode || "";
  order.giftCardDiscount = giftCardDiscount > 0 ? giftCardDiscount : 0;
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
    await processOrderRewardPoints(order, { rewardPointsUsed, userId });
    if (giftCardCode && giftCardDiscount > 0) {
      await consumeGiftCard(giftCardCode, giftCardDiscount, { orderId: order._id });
    }
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
  rewardPointsUsed = 0,
  rewardDiscount = 0,
  rewardPointsEarned = 0,
  giftCardCode = "",
  giftCardDiscount = 0,
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
    rewardPointsUsed,
    rewardDiscount,
    rewardPointsEarned,
    giftCardCode,
    giftCardDiscount,
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
    void dispatchDeliveryOrder(completed).catch(err => console.error(err));
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
    rewardPointsUsed: rewardPointsUsed > 0 ? rewardPointsUsed : 0,
    rewardDiscount: rewardDiscount > 0 ? rewardDiscount : 0,
    rewardPointsEarned: rewardPointsEarned > 0 ? rewardPointsEarned : 0,
    giftCardCode: giftCardCode || "",
    giftCardDiscount: giftCardDiscount > 0 ? giftCardDiscount : 0,
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

  if (status !== "attempted") {
    await processOrderRewardPoints(order, { rewardPointsUsed, userId });
    if (giftCardCode && giftCardDiscount > 0) {
      await consumeGiftCard(giftCardCode, giftCardDiscount, { orderId: order._id });
    }
    await order.save();
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: { orders: order._id },
  });

  await clearCartAfterCheckout(cart, checkoutMode, orderItems, userId);

  void dispatchDeliveryOrder(order).catch(err => console.error(err));

  return order;
}
