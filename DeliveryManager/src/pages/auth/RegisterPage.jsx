import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SERVICE_LOCATIONS, citiesForState } from "../../constants/locations";

// Unique sorted state list
const ALL_STATES = [...new Set(SERVICE_LOCATIONS.map((l) => l.state))].sort();

export default function RegisterPage() {
  const { isAuthenticated, loading, register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    state: "",
    city: "",
    area: "",
    storeName: "",
    storeAddress: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cities = useMemo(() => {
    return citiesForState(formData.state).map((c) => c.name);
  }, [formData.state]);

  const areas = useMemo(() => {
    if (!formData.city) return [];
    const cityObj = citiesForState(formData.state).find((c) => c.name === formData.city);
    return [...(cityObj?.areas || [])].sort();
  }, [formData.state, formData.city]);

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset downstream when parent changes
      if (name === "state") { updated.city = ""; updated.area = ""; }
      if (name === "city") { updated.area = ""; }
      return updated;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!formData.state || !formData.city || !formData.area) {
      setError("Please select state, city and area");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        state: formData.state,
        city: formData.city,
        area: formData.area,
        storeName: formData.storeName,
        storeAddress: formData.storeAddress,
      });
      // After successful registration, go straight to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-primary bg-white disabled:bg-slate-50 disabled:text-slate-400";
  const inputClass =
    "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-primary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f7f4] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-primary">
            GreenGroo
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Register Your Store</h1>
          <p className="mt-1 text-sm text-gray-500">Become a delivery manager partner</p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          {/* Store Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Store Name</label>
            <input
              type="text"
              name="storeName"
              required
              value={formData.storeName}
              onChange={handleChange}
              placeholder="Your Store Name"
              className={inputClass}
            />
          </div>

          {/* Manager Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Manager Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Full Name"
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              pattern="[6-9][0-9]{9}"
              className={inputClass}
            />
          </div>

          {/* State */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
            <select
              name="state"
              required
              value={formData.state}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">Select State</option>
              {ALL_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
            <select
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              disabled={!formData.state}
              className={selectClass}
            >
              <option value="">
                {formData.state ? "Select City" : "Select State first"}
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Area */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Area / Locality</label>
            <select
              name="area"
              required
              value={formData.area}
              onChange={handleChange}
              disabled={!formData.city}
              className={selectClass}
            >
              <option value="">
                {formData.city ? "Select Area" : "Select City first"}
              </option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Store Address */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Store Address</label>
            <textarea
              name="storeAddress"
              value={formData.storeAddress}
              onChange={handleChange}
              placeholder="Full store address"
              rows="2"
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-green-dark py-3 text-sm font-semibold text-white hover:bg-green-primary disabled:opacity-60"
          >
            {submitting ? "Registering…" : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-green-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
