import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  STATES,
  citiesForState,
  cityById,
} from "../../constants/locations";

export default function RegisterPage() {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    state: "",
    cityId: "",
    area: "",
    storeName: "",
    storeAddress: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cities = useMemo(() => citiesForState(form.state), [form.state]);
  const city = useMemo(() => cityById(form.cityId), [form.cityId]);
  const areas = city?.areas || [];

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "state") {
        return { ...prev, state: value, cityId: "", area: "" };
      }
      if (name === "cityId") {
        return { ...prev, cityId: value, area: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.state) {
      setError("Please select your state");
      return;
    }
    if (!form.cityId || !city) {
      setError("Please select your city");
      return;
    }
    if (!form.area) {
      setError("Please select your area");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        state: form.state,
        city: city.name,
        cityId: city.id,
        area: form.area,
        storeName: form.storeName || `${form.area} Store`,
        storeAddress:
          form.storeAddress ||
          `${form.storeName || `${form.area} Store`}, ${form.area}, ${city.name}, ${form.state}`,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    "w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-green-primary disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f7f4] px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-primary">
            GreenRow
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Delivery Manager Register</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your area gets its own store inventory &amp; dashboard
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Full name" name="name" value={form.name} onChange={onChange} />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
          />
          <Field
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={onChange}
            required
            placeholder="10-digit mobile"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">1. State</label>
            <select
              name="state"
              value={form.state}
              onChange={onChange}
              required
              className={selectClass}
            >
              <option value="">Select state</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">2. City</label>
            <select
              name="cityId"
              value={form.cityId}
              onChange={onChange}
              required
              disabled={!form.state}
              className={selectClass}
            >
              <option value="">
                {form.state ? "Select city" : "Select state first"}
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">3. Area</label>
            <select
              name="area"
              value={form.area}
              onChange={onChange}
              required
              disabled={!form.cityId}
              className={selectClass}
            >
              <option value="">
                {form.cityId ? "Select area" : "Select city first"}
              </option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Store name (optional)"
            name="storeName"
            value={form.storeName}
            onChange={onChange}
            placeholder={`${form.area || "Area"} Store`}
          />

          <Field
            label="Store address (for offline driver visits)"
            name="storeAddress"
            value={form.storeAddress}
            onChange={onChange}
            placeholder="Full address riders should visit for verification"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-green-dark py-3 text-sm font-semibold text-white hover:bg-green-primary disabled:opacity-60"
          >
            {submitting ? "Creating store…" : "Register & seed inventory"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-green-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-green-primary"
      />
    </div>
  );
}
