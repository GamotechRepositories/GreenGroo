import StoreOrder, { randomDeliveryOtp } from "../models/StoreOrder.js";
import { sendDeliveryVerificationOtp } from "@greengrocc/shared";

/** Customer's 10-digit phone: delivery address number first, then account phone, then the store copy. */
export async function resolveCustomerPhone(order) {
  let phone = "";
  if (order.sourceOrderId) {
    try {
      const { default: EcommerceOrder } = await import("../../../legacy/models/order/Order.js");
      const ecomOrder = await EcommerceOrder.findById(order.sourceOrderId).populate("user", "phone").lean();
      phone =
        ecomOrder?.deliveryAddress?.number ||
        ecomOrder?.deliveryAddress?.phone ||
        ecomOrder?.user?.phone ||
        "";
    } catch (err) {
      console.warn("[deliveryOtpSms] could not fetch customer phone from Order:", err.message);
    }
  }
  if (!phone) phone = order.customerPhone || "";
  return String(phone).replace(/\D/g, "").slice(-10);
}

/**
 * SMS the delivery verification OTP (MSG91_TEMPLATE_DELIVERY_VERIFY) to the customer.
 * The customer reads it out to the rider at the door to complete delivery.
 */
export async function sendDeliveryOtpSms(order) {
  if (order.customerOtpVerified) return { success: true, alreadyVerified: true };

  const customerPhone = await resolveCustomerPhone(order);
  if (!customerPhone) {
    return { success: false, status: 400, message: "Customer phone number not available for this order" };
  }

  const otpCode = String(order.otpCode || randomDeliveryOtp()).trim();
  const result = await sendDeliveryVerificationOtp(customerPhone, otpCode);

  await StoreOrder.updateOne(
    { _id: order._id },
    { $set: { otpCode, customerOtpSmsSentAt: new Date() } }
  );
  order.otpCode = otpCode;

  return { success: true, customerPhone, devMock: result.devMock };
}

/** Fire-and-forget hook for status transitions into out_for_delivery; sends at most once per order. */
export function sendDeliveryOtpSmsOnDispatch(order) {
  if (!order || order.customerOtpVerified || order.customerOtpSmsSentAt) return;
  StoreOrder.updateOne(
    { _id: order._id, customerOtpSmsSentAt: { $exists: false } },
    { $set: { customerOtpSmsSentAt: new Date() } }
  )
    .then((claim) => (claim.modifiedCount ? sendDeliveryOtpSms(order) : null))
    .then((r) => {
      if (!r) return;
      if (r.success && !r.alreadyVerified) {
        console.log(`[deliveryOtpSms] OTP SMS sent for ${order.orderNumber || order._id} to ****${r.customerPhone.slice(-4)}`);
      } else if (!r.success) {
        console.warn(`[deliveryOtpSms] skipped for ${order.orderNumber || order._id}: ${r.message}`);
      }
    })
    .catch((err) => console.warn(`[deliveryOtpSms] failed for ${order.orderNumber || order._id}:`, err.message));
}
