import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCurrentStoreLocation } from "../../hooks/useCurrentStoreLocation";

export default function RegisterPage() {
  const { isAuthenticated, loading, register } = useAuth();
  const navigate = useNavigate();
  const { location, detecting, error: locationError, detect } = useCurrentStoreLocation({
    auto: true,
  });
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

  useEffect(() => {
    if (!location) return;
    setFormData((prev) => ({
      ...prev,
      state: location.state || prev.state,
      city: location.city || prev.city,
      area: location.area || prev.area,
      storeAddress: location.address || prev.storeAddress,
    }));
  }, [location]);

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    let storeLocation = location;
    if (!storeLocation?.latitude || !storeLocation?.longitude) {
      try {
        storeLocation = await detect();
      } catch (err) {
        setError(err.message || "Allow current location to register this store");
        return;
      }
    }

    const state = formData.state || storeLocation.state;
    const city = formData.city || storeLocation.city;
    const area = formData.area || storeLocation.area;
    if (!state || !city || !area) {
      setError("State, city and area are required from your current location");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        state,
        city,
        area,
        storeName: formData.storeName,
        storeAddress: formData.storeAddress || storeLocation.address,
        latitude: storeLocation.latitude,
        longitude: storeLocation.longitude,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-primary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f7f4] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-primary">
            GreenGroo
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Register Your Store</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your current location becomes this dark store’s delivery hub
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Current location
                </p>
                {detecting ? (
                  <p className="mt-1 text-sm font-semibold text-slate-700">Detecting…</p>
                ) : location ? (
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">{location.label}</p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-rose-600">
                    {locationError || "Allow location to set your store area"}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => detect().catch(() => {})}
                disabled={detecting}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {detecting ? "Locating…" : "Use current location"}
              </button>
            </div>
          </div>

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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                placeholder="From current location"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="From current location"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Area / Locality</label>
            <input
              type="text"
              name="area"
              required
              value={formData.area}
              onChange={handleChange}
              placeholder="From current location"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Store Address</label>
            <textarea
              name="storeAddress"
              value={formData.storeAddress}
              onChange={handleChange}
              placeholder="Filled from current location"
              rows="2"
              className={inputClass}
            />
          </div>

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
            disabled={submitting || detecting}
            className="w-full rounded-xl bg-green-dark py-3 text-sm font-semibold text-white hover:bg-green-primary disabled:opacity-60"
          >
            {submitting ? "Registering…" : "Create store at this location"}
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
