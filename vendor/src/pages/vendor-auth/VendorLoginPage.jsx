import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { useDriverAuth } from "../../context/DriverAuthContext";
import { vendorApi } from "../../api/vendorApi";

export default function VendorLoginPage() {
  const { login: vendorLogin, logout: vendorLogout } = useVendorAuth();
  const { login: driverLogin, logout: driverLogout } = useDriverAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from?.pathname || "";

  const [step, setStep] = useState("login"); // "login" | "otp"
  const [form, setForm] = useState({ mobile: "", password: "" });
  const [otpValue, setOtpValue] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (e) => {
    setError("");
    const { name } = e.target;
    let { value } = e.target;
    if (name === "mobile") {
      value = value.replace(/\D/g, "");
      if (value.length > 10 && value.startsWith("91")) value = value.slice(-10);
      value = value.slice(0, 10);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mobile || !form.password) {
      setError("Mobile and password are required");
      return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      setError("Enter a valid 10 digit mobile number");
      return;
    }
    setSubmitting(true);
    setError("");
    setOtpMsg("");
    const credentials = { mobile: form.mobile.trim(), password: form.password };
    const [vendorResult, driverResult] = await Promise.allSettled([
      vendorLogin(credentials),
      driverLogin(credentials),
    ]);
    setSubmitting(false);

    // If vendor credentials matched and OTP is required
    if (vendorResult.status === "fulfilled" && vendorResult.value?.requireOtp) {
      driverLogout();
      setStep("otp");
      setOtpValue("");
      setResendTimer(30);
      setOtpMsg(
        vendorResult.value?.code
          ? `OTP sent via 9. GreenGrocc Common OTP (Dev code: ${vendorResult.value.code})`
          : vendorResult.value?.message || "OTP sent via 9. GreenGrocc Common OTP"
      );
      return;
    }

    const vendorOk = vendorResult.status === "fulfilled" && vendorResult.value?.token;
    const driverOk = driverResult.status === "fulfilled" && driverResult.value?.token;

    const defaultVendorTarget = (() => {
      try {
        const raw = localStorage.getItem("greengroo_vendor_panel_settings");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.display?.defaultLandingPage) return parsed.display.defaultLandingPage;
        }
      } catch {}
      return "/dashboard";
    })();

    if (vendorOk && !driverOk) {
      driverLogout();
      navigate(fromPath.startsWith("/vendor/") || fromPath.startsWith("/dashboard") ? fromPath : defaultVendorTarget, { replace: true });
      return;
    }
    if (driverOk && !vendorOk) {
      vendorLogout();
      navigate(fromPath.startsWith("/driver/") ? fromPath : "/driver", { replace: true });
      return;
    }
    if (vendorOk && driverOk) {
      driverLogout();
      navigate(fromPath.startsWith("/vendor/") || fromPath.startsWith("/dashboard") ? fromPath : defaultVendorTarget, { replace: true });
      return;
    }

    const vendorErr = vendorResult.status === "rejected" ? vendorResult.reason : null;
    const driverErr = driverResult.status === "rejected" ? driverResult.reason : null;
    const isAuthError = (err) => [400, 401, 403].includes(err?.response?.status);
    const authErr = [vendorErr, driverErr].find(isAuthError);
    setError(
      authErr?.response?.data?.message ||
        vendorErr?.response?.data?.message ||
        driverErr?.response?.data?.message ||
        vendorErr?.message ||
        "Invalid credentials"
    );
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = String(otpValue || "").trim();
    if (!cleanOtp) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await vendorLogin({
        mobile: form.mobile.trim(),
        password: form.password,
        otp: cleanOtp,
      });

      const defaultVendorTarget = (() => {
        try {
          const raw = localStorage.getItem("greengroo_vendor_panel_settings");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.display?.defaultLandingPage) return parsed.display.defaultLandingPage;
          }
        } catch {}
        return "/dashboard";
      })();

      driverLogout();
      navigate(fromPath.startsWith("/vendor/") || fromPath.startsWith("/dashboard") ? fromPath : defaultVendorTarget, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Invalid or expired OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError("");
    setOtpMsg("");
    try {
      const res = await vendorApi.resendLoginOtp({
        mobile: form.mobile.trim(),
        password: form.password,
      });
      setResendTimer(30);
      setOtpMsg(
        res?.data?.code
          ? `New OTP sent via 9. GreenGrocc Common OTP (Dev code: ${res.data.code})`
          : res?.data?.message || "New OTP sent via 9. GreenGrocc Common OTP"
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAF9] px-4">
      <div className="w-full max-w-sm border border-[#D4D4D4] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-[#217346]">
            <span className="text-xl font-bold text-white">G</span>
          </div>
          <h1 className="text-base font-bold text-[#1F2937]">
            {step === "otp" ? "Verify OTP" : "Sign In"}
          </h1>
          <p className="mt-1 text-xs text-[#6B7280]">
            {step === "otp"
              ? `Verification OTP sent to +91 ${form.mobile}`
              : "Use your mobile and password"}
          </p>
        </div>

        {error ? (
          <div className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        ) : null}

        {step === "otp" ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-lg border border-[#217346]/20 bg-[#217346]/5 p-2.5 text-center">
              <span className="text-[11px] font-medium text-[#217346]">
                Security verification with 9. GreenGrocc Common OTP
              </span>
            </div>
            {otpMsg ? (
              <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {otpMsg}
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="w-full border border-[#D4D4D4] px-3 py-2 text-center text-sm font-bold tracking-widest text-[#1F2937] outline-none focus:border-[#217346]"
                autoFocus
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("login");
                  setOtpValue("");
                  setError("");
                  setOtpMsg("");
                }}
                className="text-xs text-[#6B7280] hover:text-[#1F2937] hover:underline"
              >
                ← Back to Sign In
              </button>
              {resendTimer > 0 ? (
                <span className="text-xs text-[#9CA3AF]">Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="font-semibold text-[#217346] hover:underline disabled:opacity-50"
                >
                  {resending ? "Resending…" : "Resend OTP"}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || otpValue.length < 4}
              className="w-full bg-[#217346] py-2 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-60"
            >
              {submitting ? "Verifying OTP…" : "Verify & Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                inputMode="numeric"
                maxLength={10}
                pattern="\d{10}"
                title="10 digit mobile number"
                value={form.mobile}
                onChange={handleChange}
                placeholder="10 digit mobile number"
                className="w-full border border-[#D4D4D4] px-3 py-2 text-xs outline-none focus:border-[#217346]"
                autoComplete="tel-national"
              />
              {form.mobile && form.mobile.length < 10 ? (
                <p className="mt-1 text-[10px] text-[#9CA3AF]">
                  {10 - form.mobile.length} more digit{10 - form.mobile.length === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-[#D4D4D4] px-3 py-2 text-xs outline-none focus:border-[#217346]"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || form.mobile.length !== 10 || !form.password}
              className="w-full bg-[#217346] py-2 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
