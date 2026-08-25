import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDriverAuth } from "../../context/DriverAuthContext";

export default function DriverLoginPage() {
  const { login } = useDriverAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mobile || !form.password) {
      setError("Mobile and password are required");
      return;
    }
    setSubmitting(true);
    try {
      await login({ mobile: form.mobile.trim(), password: form.password });
      navigate("/driver/assigned", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAF9] px-4">
      <div className="w-full max-w-sm border border-[#D4D4D4] bg-white p-8 shadow-sm">
        <h1 className="text-base font-bold text-[#1F2937]">Driver Login</h1>
        <p className="mt-1 text-xs text-[#6B7280]">View assigned pickups only. You cannot confirm pickup.</p>
        {error ? <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input className="w-full border border-[#D4D4D4] px-3 py-2 text-xs" name="mobile" placeholder="Mobile" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
          <input className="w-full border border-[#D4D4D4] px-3 py-2 text-xs" type="password" name="password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <button type="submit" disabled={submitting} className="w-full bg-[#217346] py-2 text-xs font-semibold text-white disabled:opacity-60">
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-[10px] text-[#6B7280]">
          Default password: <code className="font-semibold">driver123</code>
        </p>
        <p className="mt-2 text-center text-[10px]">
          <Link to="/vendor/login" className="text-[#217346]">Vendor login</Link>
        </p>
      </div>
    </div>
  );
}
