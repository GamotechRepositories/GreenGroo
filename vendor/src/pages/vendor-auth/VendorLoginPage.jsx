import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { useDriverAuth } from "../../context/DriverAuthContext";

export default function VendorLoginPage() {
  const { login: vendorLogin, logout: vendorLogout } = useVendorAuth();
  const { login: driverLogin, logout: driverLogout } = useDriverAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mobile || !form.password) {
      setError("Mobile and password are required");
      return;
    }
    setSubmitting(true);
    setError("");
    const credentials = { mobile: form.mobile.trim(), password: form.password };
    const [vendorResult, driverResult] = await Promise.allSettled([
      vendorLogin(credentials),
      driverLogin(credentials),
    ]);
    setSubmitting(false);

    const vendorOk = vendorResult.status === "fulfilled";
    const driverOk = driverResult.status === "fulfilled";

    if (vendorOk && !driverOk) {
      driverLogout();
      navigate("/vendor/farmer-managers", { replace: true });
      return;
    }
    if (driverOk && !vendorOk) {
      vendorLogout();
      navigate("/driver/assigned", { replace: true });
      return;
    }
    if (vendorOk && driverOk) {
      driverLogout();
      navigate("/vendor/farmer-managers", { replace: true });
      return;
    }

    const vendorErr = vendorResult.status === "rejected" ? vendorResult.reason : null;
    const driverErr = driverResult.status === "rejected" ? driverResult.reason : null;
    setError(vendorErr?.response?.data?.message || driverErr?.response?.data?.message || "Invalid credentials");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAF9] px-4">
      <div className="w-full max-w-sm border border-[#D4D4D4] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-[#217346]">
            <span className="text-xl font-bold text-white">G</span>
          </div>
          <h1 className="text-base font-bold text-[#1F2937]">Sign In</h1>
          <p className="mt-1 text-xs text-[#6B7280]">Use your mobile and password</p>
        </div>

        {error ? (
          <div className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Mobile number"
              className="w-full border border-[#D4D4D4] px-3 py-2 text-xs outline-none focus:border-[#217346]"
              autoComplete="tel"
            />
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
            disabled={submitting}
            className="w-full bg-[#217346] py-2 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
