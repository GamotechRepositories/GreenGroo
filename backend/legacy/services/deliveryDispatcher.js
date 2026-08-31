import StoreOrder from "../../delivery-service/src/models/StoreOrder.js";
import StoreInventory from "../../delivery-service/src/models/StoreInventory.js";
import {
  readCoords,
  resolveDarkStoreForAddress,
} from "../../delivery-service/src/services/darkStoreResolver.js";
import { seedManagerStore } from "../../delivery-service/src/services/seedManagerStore.js";
import { getIO } from "../../socket.js";
import Product from "../models/Product.js";

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

async function mapItemsToStoreCatalog(managerId, ecommerceItems = []) {
  const inventory = await StoreInventory.find({ managerId, isActive: true });
  const productIds = ecommerceItems
    .map((item) => item.product?._id || item.product)
    .filter(Boolean);
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select("sku name")
    : [];
  const productById = new Map(products.map((p) => [p._id.toString(), p]));

  return ecommerceItems.map((item) => {
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
    };
  });
}

/**
 * Route a confirmed customer order to the dark store that covers that address.
 * Creates a StoreOrder so the correct Delivery Manager can confirm, deduct stock, and dispatch.
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

    const { manager, reason, distanceKm } = await resolveDarkStoreForAddress(address);
    if (!manager) {
      console.warn(
        "[deliveryDispatcher] No dark store within 5 km of this address",
        ecommerceOrder._id,
        { city: address.city, area: address.area, reason }
      );
      return null;
    }

    await seedManagerStore(manager);

    const customerAddress = formatCustomerAddress(address) || "Customer address";
    const items = await mapItemsToStoreCatalog(manager._id, ecommerceOrder.items || []);
    if (!items.length) {
      console.warn("[deliveryDispatcher] Order has no items", ecommerceOrder._id);
      return null;
    }

    const orderNum = ecommerceOrder.orderNumber
      ? `CUST-${ecommerceOrder.orderNumber}`
      : `CUST-${String(ecommerceOrder._id).slice(-8).toUpperCase()}`;

    const customerCoords = readCoords(address);
    const roundedDistance =
      distanceKm != null ? Math.round(distanceKm * 10) / 10 : null;

    const storeOrder = await StoreOrder.create({
      orderNumber: orderNum,
      managerId: manager._id,
      darkStoreId: manager._id,
      sourceOrderId: ecommerceOrder._id || null,
      city: manager.city || address.city || "",
      cityId: manager.cityId || "",
      area: address.area || manager.area || "",
      customerName: address.fullName || "Customer",
      customerPhone: address.number || "",
      customerAddress,
      customerLat: customerCoords?.lat ?? null,
      customerLng: customerCoords?.lng ?? null,
      distanceKm: roundedDistance,
      items,
      status: "order_received",
      darkStoreQrCode: `DARKSTORE_${manager._id}`,
      otpCode: String(Math.floor(1000 + Math.random() * 9000)),
      notes: `Customer order ${ecommerceOrder.orderNumber || ecommerceOrder._id} routed by ${reason}${
        roundedDistance != null ? ` (${roundedDistance} km)` : ""
      }`,
    });

    console.log(
      `[deliveryDispatcher] Order ${orderNum} → ${manager.storeName || manager.area} (${reason})`
    );

    try {
      getIO().to(`store_${manager._id}`).emit("new_order_received", {
        orderId: storeOrder._id.toString(),
        orderNumber: storeOrder.orderNumber,
        customerName: storeOrder.customerName,
        customerPhone: storeOrder.customerPhone,
        itemsCount: storeOrder.items.length,
        storeName: manager.storeName || `${manager.area} Store`,
      });
    } catch (err) {
      console.warn("[deliveryDispatcher] socket emit failed:", err.message);
    }

    return storeOrder;
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
