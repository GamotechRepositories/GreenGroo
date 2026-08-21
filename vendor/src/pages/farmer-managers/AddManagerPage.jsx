import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
];

const FIELD = "w-full border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]";
const LABEL = "mb-1 block text-xs font-semibold text-gray-700";

export default function AddManagerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", address: "",
    city: "", state: "", pincode: "", password: "",
    joiningDate: new Date().toISOString().split("T")[0],
    status: "Active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile) { setError("Name and mobile are required"); return; }
    if (form.mobile.length !== 10) { setError("Mobile must be 10 digits"); return; }
    setSubmitting(true);
    try {
      await vendorApi.createManager(form);
      navigate("/vendor/farmer-managers");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create manager");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/vendor/farmer-managers" className="hover:text-[#217346]">Farmer Managers</Link>
        <span>›</span>
        <span className="text-gray-700 font-semibold">Add Manager</span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Add Farmer Manager</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a new manager account under your vendor</p>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 bg-white p-6">
        {/* Personal Info */}
        <p className="text-xs font-bold text-[#217346] uppercase tracking-wide">Personal Information</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Full Name *</label>
            <input className={FIELD} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Kapil Deshmukh" required />
          </div>
          <div>
            <label className={LABEL}>Mobile Number *</label>
            <input className={FIELD} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="9876543210" maxLength={10} required />
          </div>
          <div>
            <label className={LABEL}>Email</label>
            <input type="email" className={FIELD} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="manager@example.com" />
          </div>
          <div>
            <label className={LABEL}>Joining Date</label>
            <input type="date" className={FIELD} value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
          </div>
        </div>

        {/* Location */}
        <p className="text-xs font-bold text-[#217346] uppercase tracking-wide pt-2">Location</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={LABEL}>Address</label>
            <input className={FIELD} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="House No, Street, Area" />
          </div>
          <div>
            <label className={LABEL}>City</label>
            <input className={FIELD} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Nashik" />
          </div>
          <div>
            <label className={LABEL}>State</label>
            <select className={FIELD} value={form.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Pincode</label>
            <input className={FIELD} value={form.pincode} onChange={(e) => set("pincode", e.target.value)} placeholder="422001" maxLength={6} />
          </div>
        </div>

        {/* Account */}
        <p className="text-xs font-bold text-[#217346] uppercase tracking-wide pt-2">Account Settings</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Password</label>
            <input type="password" className={FIELD} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Default: manager123" />
          </div>
          <div>
            <label className={LABEL}>Status</label>
            <select className={FIELD} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="bg-[#217346] px-6 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-60">
            {submitting ? "Creating…" : "Create Manager"}
          </button>
          <button type="button" onClick={() => navigate("/vendor/farmer-managers")} className="border border-gray-300 px-6 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
