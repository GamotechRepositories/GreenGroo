const ACTIVE_STATUSES = new Set(["confirm", "processing", "shipping"]);

/**
 * Shows the 4-digit delivery OTP the customer must share with the rider
 * to complete delivery.
 */
export default function DeliveryOtpBanner({ order }) {
  const otp = String(order?.deliveryOtp || order?.otpCode || "").trim();
  if (!otp || !ACTIVE_STATUSES.has(order?.status)) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
        Delivery OTP
      </p>
      <p className="mt-1 text-sm text-emerald-900/80">
        Share this code with the delivery partner to confirm your order is received.
      </p>
      <p className="mt-2.5 font-mono text-3xl font-black tracking-[0.35em] text-emerald-900">
        {otp}
      </p>
    </div>
  );
}
