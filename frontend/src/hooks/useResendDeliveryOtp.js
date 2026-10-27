import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { resendCustomerDeliveryOtp } from "../api/api";

/** Resend the delivery OTP SMS (MSG91 delivery-verify template) with a cooldown countdown. */
export function useResendDeliveryOtp(orderId) {
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resend = async () => {
    if (!orderId || sending || cooldown > 0) return;
    setSending(true);
    try {
      const { data } = await resendCustomerDeliveryOtp(orderId);
      toast.success(data?.message || "Delivery OTP sent by SMS");
      setCooldown(Number(data?.retryAfter) || 30);
    } catch (err) {
      const body = err?.response?.data;
      if (body?.retryAfter) setCooldown(Number(body.retryAfter));
      toast.error(body?.message || "Couldn't send the OTP. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return { resend, sending, cooldown };
}
