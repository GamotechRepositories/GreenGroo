import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import StoreInventory from "../../delivery-service/src/models/StoreInventory.js";
import {
  ORDER_ROUTING_RADIUS_KM,
  readCoords,
  resolveDarkStoreForOrder,
} from "../../delivery-service/src/services/darkStoreResolver.js";
import { seedManagerStore } from "../../delivery-service/src/services/seedManagerStore.js";
import { getIO } from "../../socket.js";
import Product from "../models/Product.js";
import { geocodeAddressString } from "./reverseGeocodeService.js";
import { computePreOrderDate, normalizePreOrderSlot } from "../utils/preOrderHelpers.js";
import {
  collectDepartments,
  normalizeFulfillmentType,
  sectionToDepartment,
} from "../utils/departmentHelpers.js";

function formatCustomerAddress(address = {}) {
  const parts = [];
  if (address.shopNo) parts.push(address.shopNo);
  if (address.shopName) parts.push(address.shopName);
  if (address.fullAddress) parts.push(address.fullAddress);
  if (address.landmark) parts.push(address.landmark);
  if (address.area) parts.push(address.area);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.pincode) parts.push(address.pincode);
  return parts.join(", ");
}

function scoreNameMatch(productName, inventoryName) {
  const a = String(productName || "").trim().toLowerCase();
  const b = String(inventoryName || "").trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 70;
  const aTokens = a.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const hits = aTokens.filter((t) => b.includes(t)).length;
  return hits ? 40 + hits * 5 : 0;
}

/** Department + department-wise id per order line. */
async function resolveItemDepartments(ecommerceItems = []) {
  const productIds = ecommerceItems
    .map((item) => item.product?._id || item.product)
    .filter(Boolean);
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } })
        .select("section storeType departmentId")
        .lean()
    : [];
  const productById = new Map(products.map((p) => [p._id.toString(), p]));

  return ecommerceItems.map((item) => {
    const product = productById.get(String(item.product?._id || item.product || ""));
    return {
      department: item.department || sectionToDepartment(product?.section, product?.storeType),
      departmentId: item.departmentId || product?.departmentId || "",
    };
  });
}

async function mapItemsToStoreCatalog(managerId, ecommerceItems = [], itemDepartments = []) {
  const inventory = await StoreInventory.find({ managerId, isActive: true });
  const productIds = ecommerceItems
    .map((item) => item.product?._id || item.product)
    .filter(Boolean);
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select("sku name")
    : [];
  const productById = new Map(products.map((p) => [p._id.toString(), p]));

  return ecommerceItems.map((item, index) => {
    const productId = String(item.product?._id || item.product || "");
    const product = productById.get(productId);
    const productSku = String(product?.sku || item.sku || "").trim();
    const productName = item.name || product?.name || "Item";

    let match = null;
    if (productSku) {
      match = inventory.find(
        (row) => String(row.sku).toLowerCase() === productSku.toLowerCase()
      );
    }
    if (!match) {
      match = inventory.reduce((best, row) => {
        const score = scoreNameMatch(productName, row.name);
        if (score < 40) return best;
        if (!best || score > best.score) return { row, score };
        return best;
      }, null)?.row;
    }

    return {
      sku: match?.sku || productSku || (productId ? `P-${productId.slice(-8)}` : `ITEM-${Date.now()}`),
      name: match?.name || productName,
      quantity: Math.max(1, Number(item.quantity || item.qty || 1)),
      unit: match?.unit || "pcs",
      price: Number(item.price || match?.price || 0),
      department: itemDepartments[index]?.department || "",
      departmentId: itemDepartments[index]?.departmentId || "",
    };
  });
}

/**
 * Route a confirmed customer order to the dark store that covers that address.
 * Creates a StoreOrder so the correct Delivery Manager can confirm, deduct stock, and dispatch.
 * Pre-orders are held (status "preorder_hold") for the Product Manager to prepare and forward.
 * A mixed cart with a slot becomes two StoreOrders: Ready2Cook / Instant now, pre-order items at the slot.
 */
export async function dispatchDeliveryOrder(ecommerceOrder) {
  try {
    if (ecommerceOrder?.status === "attempted") {
      return null;
    }

    const address = ecommerceOrder.deliveryAddress;
    if (!address) {
      console.error("[deliveryDispatcher] No delivery address found for order", ecommerceOrder._id);
      return null;
    }

    if (ecommerceOrder._id) {
      const alreadyRouted = await StoreOrder.findOne({ sourceOrderId: ecommerceOrder._id });
      if (alreadyRouted) {
        return alreadyRouted;
      }
    }

    const preOrderSlot = normalizePreOrderSlot(ecommerceOrder.preOrderSlot);
    const fulfillmentType = normalizeFulfillmentType(ecommerceOrder.fulfillmentType);
    const itemDepartments = await resolveItemDepartments(ecommerceOrder.items || []);
    const departments = collectDepartments(itemDepartments);

    const customerAddress = formatCustomerAddress(address) || "Customer address";
    let customerCoords = readCoords(address);
    if (!customerCoords && customerAddress) {
      customerCoords = await geocodeAddressString(customerAddress);
    }

    // Ready2Cook / Instant need a store within 3 km; a pure pre-order may also use a same-pincode store.
    const allowPincodeFallback =
      departments.length > 0 && departments.every((dept) => dept === "preorder");
    const { manager, reason, distanceKm } = await resolveDarkStoreForOrder(
      { ...address, ...(customerCoords ? { lat: customerCoords.lat, lng: customerCoords.lng } : {}) },
      { allowPincodeFallback, anyDistance: fulfillmentType === "pickup" }
    );
    if (!manager) {
      console.warn(
        `[deliveryDispatcher] No dark store within ${ORDER_ROUTING_RADIUS_KM} km${
          allowPincodeFallback ? " or same pincode" : ""
        } of this address`,
        ecommerceOrder._id,
        { city: address.city, area: address.area, pincode: address.pincode, departments, reason }
      );
      return null;
    }

    await seedManagerStore(manager);

    const items = await mapItemsToStoreCatalog(
      manager._id,
      ecommerceOrder.items || [],
      itemDepartments
    );
    if (!items.length) {
      console.warn("[deliveryDispatcher] Order has no items", ecommerceOrder._id);
      return null;
    }

    const orderNum = ecommerceOrder.orderNumber
      ? `CUST-${ecommerceOrder.orderNumber}`
      : `CUST-${String(ecommerceOrder._id).slice(-8).toUpperCase()}`;

    const roundedDistance =
      distanceKm != null ? Math.round(distanceKm * 10) / 10 : null;

    // One OTP per customer order: it unlocks the rider delivery or the store-counter handover of every part.
    const otpCode = String(Math.floor(1000 + Math.random() * 9000));
    const lineTotal = (list) =>
      list.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const itemsTotal = lineTotal(items);
    const deliveryCharges = Number(ecommerceOrder.deliveryCharges || 0);
    const orderTotal = Number(ecommerceOrder.total || itemsTotal + deliveryCharges);
    const ecommercePayMethod = String(ecommerceOrder.paymentMethod || "").toLowerCase();
    const isOnlinePaid =
      ecommercePayMethod === "online" &&
      ["paid", "paid_10"].includes(String(ecommerceOrder.paymentStatus || "").toLowerCase());
    const storePaymentMethod =
      ecommercePayMethod === "cod" || ecommercePayMethod === "COD" ? "COD" : ecommercePayMethod === "online" ? "online" : "COD";

    // The slot applies to pre-order lines only; Ready2Cook / Instant lines go out right away.
    const preItems = preOrderSlot ? items.filter((item) => item.department === "preorder") : [];
    const nowItems = preOrderSlot ? items.filter((item) => item.department !== "preorder") : items;
    const isMixed = preItems.length > 0 && nowItems.length > 0;
    const parts = [];
    if (nowItems.length) parts.push({ key: isMixed ? "now" : "", items: nowItems, isPreOrder: false });
    if (preItems.length) parts.push({ key: isMixed ? "preorder" : "", items: preItems, isPreOrder: true });

    // Delivery charges ride with the first part; the rest of the bill is shared by item value.
    const goodsTotal = Math.max(0, orderTotal - deliveryCharges);
    let remaining = Math.round(orderTotal);
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        part.amount = remaining;
        return;
      }
      const share = itemsTotal > 0 ? lineTotal(part.items) / itemsTotal : 1 / parts.length;
      part.amount = Math.round(goodsTotal * share + (index === 0 ? deliveryCharges : 0));
      remaining -= part.amount;
    });

    const hasPreOrderPart = preItems.length > 0;
    const preOrderDate = hasPreOrderPart
      ? ecommerceOrder.preOrderDate || computePreOrderDate(ecommerceOrder.createdAt || new Date())
      : "";

    const created = [];
    for (const part of parts) {
      const partDepartments = collectDepartments(part.items);
      const storeOrder = await StoreOrder.create({
        orderNumber: part.key === "preorder" ? `${orderNum}-PR` : orderNum,
        managerId: manager._id,
        darkStoreId: manager._id,
        sourceOrderId: ecommerceOrder._id || null,
        sourcePart: part.key,
        fulfillmentType,
        city: manager.city || address.city || "",
        cityId: manager.cityId || "",
        area: address.area || manager.area || "",
        customerName: address.fullName || "Customer",
        customerPhone: address.number || "",
        customerAddress,
        customerLat: customerCoords?.lat ?? null,
        customerLng: customerCoords?.lng ?? null,
        distanceKm: roundedDistance,
        items: part.items,
        status: part.isPreOrder ? "preorder_hold" : "order_received",
        isPreOrder: part.isPreOrder,
        preOrderSlot: part.isPreOrder ? preOrderSlot : "",
        preOrderDate: part.isPreOrder ? preOrderDate : "",
        preOrderStage: part.isPreOrder ? "pending" : "",
        departments: partDepartments,
        routingReason: reason || "",
        darkStoreQrCode: `DARKSTORE_${manager._id}`,
        otpCode,
        paymentMethod: storePaymentMethod,
        paymentStatus: isOnlinePaid ? "paid_online" : "pending",
        amountToCollect: isOnlinePaid ? 0 : part.amount,
        notes: `Customer order ${ecommerceOrder.orderNumber || ecommerceOrder._id} routed by ${reason}${
          roundedDistance != null ? ` (${roundedDistance} km)` : ""
        }${fulfillmentType === "pickup" ? " · customer pickup at store" : ""}${
          isMixed ? ` · ${part.isPreOrder ? "pre-order part" : "Ready2Cook / Instant part"}` : ""
        }`,
      });
      created.push(storeOrder);

      console.log(
        `[deliveryDispatcher] ${part.isPreOrder ? `Pre-order (${preOrderDate} ${preOrderSlot})` : "Order"} ${storeOrder.orderNumber} → ${manager.storeName || manager.area} (${reason}, ${fulfillmentType})`
      );

      try {
        getIO().to(`store_${manager._id}`).emit(
          part.isPreOrder ? "new_preorder_received" : "new_order_received",
          {
            orderId: storeOrder._id.toString(),
            orderNumber: storeOrder.orderNumber,
            customerName: storeOrder.customerName,
            customerPhone: storeOrder.customerPhone,
            itemsCount: storeOrder.items.length,
            storeName: manager.storeName || `${manager.area} Store`,
            departments: partDepartments,
            fulfillmentType,
            ...(part.isPreOrder ? { preOrderSlot, preOrderDate } : {}),
          }
        );
      } catch (err) {
        console.warn("[deliveryDispatcher] socket emit failed:", err.message);
      }
    }

    // Persist OTP on customer Order so frontend/userapp can show it to the customer
    if (ecommerceOrder._id) {
      try {
        const Order = (await import("../models/order/Order.js")).default;
        await Order.findByIdAndUpdate(ecommerceOrder._id, {
          deliveryOtp: otpCode,
          ...(hasPreOrderPart && !ecommerceOrder.preOrderDate ? { preOrderDate } : {}),
        });
      } catch (err) {
        console.warn("[deliveryDispatcher] failed to save deliveryOtp on Order:", err.message);
      }
    }

    return created[0];
  } catch (error) {
    if (error?.code === 11000 && ecommerceOrder?._id) {
      return StoreOrder.findOne({ sourceOrderId: ecommerceOrder._id });
    }
    console.error("[deliveryDispatcher] Failed to dispatch order", error);
    return null;
  }
}

/**
 * Re-dispatch confirmed customer orders that never got a StoreOrder (e.g. after a deploy bug).
 */
export async function reconcileMissedDispatches({ sinceHours = 72 } = {}) {
  const Order = (await import("../models/order/Order.js")).default;
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  const orders = await Order.find({
    status: "confirm",
    updatedAt: { $gte: since },
  }).select("_id");

  let created = 0;
  for (const row of orders) {
    const full = await Order.findById(row._id);
    if (!full) continue;
    const existing = await StoreOrder.findOne({ sourceOrderId: full._id });
    if (existing) continue;
    const result = await dispatchDeliveryOrder(full);
    if (result) created += 1;
  }
  if (created) {
    console.log(`[deliveryDispatcher] Reconciled ${created} missed store order(s).`);
  }
  return created;
}
