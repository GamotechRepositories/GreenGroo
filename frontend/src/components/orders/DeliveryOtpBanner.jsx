import React, { useState } from "react";
import { resendCustomerDeliveryOtp } from "../../api/api";

const ACTIVE_STATUSES = new Set(["confirm", "processing", "shipping"]);

/**
 * Shows the 4-digit delivery OTP the customer must share with the rider
 * to complete delivery, with option to send/resend via MSG91 SMS.
 */
export default function DeliveryOtpBanner({ order }) {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const otp = String(order?.deliveryOtp || order?.otpCode || "").trim();
  if (!otp || !ACTIVE_STATUSES.has(order?.status)) return null;

  const handleResendSms = async () => {
    if (!order?._id || sending) return;
    setSending(true);
    setMsg("");
    try {
      await resendCustomerDeliveryOtp(order._id);
      setMsg("SMS पाठवला आहे (Sent via SMS)");
    } catch (err) {
      setMsg(err?.response?.data?.message || "SMS पाठवण्यात त्रुटी");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
          Delivery OTP
        </p>
        <button
          type="button"
          onClick={handleResendSms}
          disabled={sending}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline disabled:opacity-60 cursor-pointer"
        >
          {sending ? "पाठवत आहे..." : "SMS वर पाठवा"}
        </button>
      </div>
      <p className="mt-1 text-sm text-emerald-900/80">
        Share this code with the delivery partner to confirm your order is received.
      </p>
      <div className="flex items-baseline justify-between mt-2.5">
        <p className="font-mono text-3xl font-black tracking-[0.35em] text-emerald-900">
          {otp}
        </p>
        {msg && <span className="text-xs font-medium text-emerald-700">{msg}</span>}
      </div>
    </div>
  );
}
