import { useResendDeliveryOtp } from "../../hooks/useResendDeliveryOtp";

const PICKUP_ACTIVE_STATUSES = new Set(["confirm", "processing", "shipping"]);

/**
 * Delivery OTP the customer shares with the rider at the door. It is SMSed to
 * the customer when the order goes out for delivery, and can be resent here.
 */
export default function DeliveryOtpBanner({ order }) {
  const { resend, sending, cooldown } = useResendDeliveryOtp(order?._id);

  const otp = String(order?.deliveryOtp || order?.otpCode || "").trim();
  const pickup = order?.fulfillmentType === "pickup";
  const visible = pickup ? PICKUP_ACTIVE_STATUSES.has(order?.status) : order?.status === "shipping";
  if (!otp || !visible) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
          {pickup ? "Pickup OTP" : "Delivery OTP"}
        </p>
        {!pickup && (
          <button
            type="button"
            onClick={resend}
            disabled={sending || cooldown > 0}
            className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-800 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60 cursor-pointer"
          >
            {sending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend SMS"}
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-emerald-900/80">
        {pickup
          ? "Show this code at the store counter to collect your order."
          : "Your order is out for delivery. We've sent this code to your phone by SMS — share it with the delivery partner to receive your items."}
      </p>
      <p className="mt-2.5 font-mono text-3xl font-black tracking-[0.35em] text-emerald-900">{otp}</p>
    </div>
  );
}
