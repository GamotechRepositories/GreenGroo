import DeliveryManager from "../../delivery-service/src/models/DeliveryManager.js";
import DeliveryOrder from "../../delivery-service/src/models/Order.js";
import { autoAssignRider } from "../../delivery-service/src/controllers/orderController.js";

/**
 * Dispatches an e-commerce order to the delivery service by routing it
 * to the nearest store and assigning an available rider.
 * @param {Object} ecommerceOrder The confirmed e-commerce order object/document
 */
export async function dispatchDeliveryOrder(ecommerceOrder) {
  try {
    const address = ecommerceOrder.deliveryAddress;
    if (!address) {
      console.error("[deliveryDispatcher] No delivery address found for order", ecommerceOrder._id);
      return null;
    }

    // 1. Find the nearest store.
    // We try to match by city first (case-insensitive).
    let manager = null;
    if (address.city) {
      manager = await DeliveryManager.findOne({
        city: new RegExp(`^${address.city}$`, "i"),
        isActive: true,
      });
    }

    // Fallback to any active store if no exact match is found
    if (!manager) {
      manager = await DeliveryManager.findOne({ isActive: true });
    }

    if (!manager) {
      console.warn(
        "[deliveryDispatcher] No active delivery manager found to handle order",
        ecommerceOrder._id
      );
      return null;
    }

    // Construct address string
    const parts = [];
    if (address.shopNo) parts.push(address.shopNo);
    if (address.shopName) parts.push(address.shopName);
    if (address.fullAddress) parts.push(address.fullAddress);
    if (address.landmark) parts.push(address.landmark);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);

    const customerAddressString = parts.join(", ");
    const customerName = address.fullName || "Customer";
    const customerPhone = address.number || "0000000000";

    // Transform items
    const deliveryItems = (ecommerceOrder.items || []).map((item) => ({
      productId: item.product?._id || item.product,
      name: item.name,
      qty: item.quantity,
      price: item.price,
    }));

    // Calculate amount to collect
    let amountToCollect = 0;
    if (ecommerceOrder.paymentStatus === "unpaid") {
      amountToCollect = ecommerceOrder.total;
    } else if (ecommerceOrder.paymentStatus === "paid_10") {
      amountToCollect = Math.max(0, ecommerceOrder.total - (ecommerceOrder.codAdvanceAmount || 0));
    }

    const deliveryMethod = ecommerceOrder.paymentMethod === "online" ? "online" : "COD";

    // 2. Create the delivery order
    const deliveryOrder = await DeliveryOrder.create({
      managerId: manager._id,
      storeId: manager._id,
      pickupAddress: manager.storeAddress || "Store Pickup",
      customerName,
      customerAddress: customerAddressString,
      customerPhone,
      customerLocation: address.location && address.location.lat ? address.location : { lat: 18.5793, lng: 73.7712 }, // Fallback dummy location
      items: deliveryItems,
      totalAmount: ecommerceOrder.total,
      paymentMethod: deliveryMethod,
      amountToCollect,
      deliveryFee: ecommerceOrder.deliveryCharges || 0,
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
      qrData: `ORDER_${manager._id}_${Date.now()}`,
      qrCode: `ORDER_${manager._id}_${Date.now()}`,
      status: "packed",
      orderTimestamps: {
        packedAt: new Date(),
      },
    });

    // 3. Auto-assign rider
    await autoAssignRider(deliveryOrder);

    return deliveryOrder;
  } catch (error) {
    console.error("[deliveryDispatcher] Failed to dispatch order", error);
    return null;
  }
}
