import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
];

const FIELD = "w-full border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#217346]";
const LABEL = "mb-1 block text-xs font-semibold text-gray-700";

export default function AddFarmerPage() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "123456",
    farmName: "",
    farmLocation: "",
    farmAddress: "",
    farmArea: "",
    farmType: "Organic",
    managerId: "",
    status: "Active",
    address: { village: "", taluka: "", district: "", state: "Maharashtra", pincode: "" },
    bank: { accountHolder: "", bankName: "", accountNumber: "", ifsc: "" },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    vendorApi.getManagers()
      .then((res) => setManagers(res.data))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAddr = (k, v) => setForm((f) => ({ ...f, address: { ...f.address, [k]: v } }));
  const setBank = (k, v) => setForm((f) => ({ ...f, bank: { ...f.bank, [k]: v } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile) {
      setError("Farmer Name and Mobile Number are required");
      return;
    }
    if (form.mobile.trim().length !== 10) {
      setError("Mobile number must be 10 digits");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await vendorApi.createFarmer(form);
      navigate("/vendor/all-farmers");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create farmer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/vendor/all-farmers" className="hover:text-[#217346]">All Farmers</Link>
        <span>›</span>
        <span className="font-semibold text-gray-700">Add Farmer</span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Add New Farmer</h1>
        <p className="mt-0.5 text-sm text-gray-500">Register a new farmer under your vendor account</p>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 border border-gray-200 bg-white p-6">
        {/* Basic Details */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">1. Basic Information</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Farmer Full Name *</label>
              <input className={FIELD} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ramesh Patil" required />
            </div>
            <div>
              <label className={LABEL}>Mobile Number *</label>
              <input className={FIELD} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="9876543210" maxLength={10} required />
            </div>
            <div>
              <label className={LABEL}>Email Address</label>
              <input type="email" className={FIELD} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="farmer@example.com" />
            </div>
            <div>
              <label className={LABEL}>Login Password</label>
              <input type="text" className={FIELD} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Default: 123456" />
            </div>
            <div>
              <label className={LABEL}>Assign Farmer Manager</label>
              <select className={FIELD} value={form.managerId} onChange={(e) => set("managerId", e.target.value)}>
                <option value="">-- Select Manager (Optional) --</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.mobile})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select className={FIELD} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Farm Details */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">2. Farm Details</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Farm Name</label>
              <input className={FIELD} value={form.farmName} onChange={(e) => set("farmName", e.target.value)} placeholder="e.g. Patil Organic Farms" />
            </div>
            <div>
              <label className={LABEL}>Farm Location / Village</label>
              <input className={FIELD} value={form.farmLocation} onChange={(e) => set("farmLocation", e.target.value)} placeholder="e.g. Nashik Rural" />
            </div>
            <div>
              <label className={LABEL}>Farm Area (Acres)</label>
              <input className={FIELD} value={form.farmArea} onChange={(e) => set("farmArea", e.target.value)} placeholder="e.g. 5 Acres" />
            </div>
            <div>
              <label className={LABEL}>Farm Type</label>
              <select className={FIELD} value={form.farmType} onChange={(e) => set("farmType", e.target.value)}>
                <option value="Organic">Organic</option>
                <option value="Inorganic">Inorganic</option>
                <option value="Hydroponic">Hydroponic</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">3. Address</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={LABEL}>Village / Town</label>
              <input className={FIELD} value={form.address.village} onChange={(e) => setAddr("village", e.target.value)} placeholder="Village" />
            </div>
            <div>
              <label className={LABEL}>Taluka</label>
              <input className={FIELD} value={form.address.taluka} onChange={(e) => setAddr("taluka", e.target.value)} placeholder="Taluka" />
            </div>
            <div>
              <label className={LABEL}>District</label>
              <input className={FIELD} value={form.address.district} onChange={(e) => setAddr("district", e.target.value)} placeholder="District" />
            </div>
            <div>
              <label className={LABEL}>State</label>
              <select className={FIELD} value={form.address.state} onChange={(e) => setAddr("state", e.target.value)}>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Pincode</label>
              <input className={FIELD} value={form.address.pincode} onChange={(e) => setAddr("pincode", e.target.value)} placeholder="422001" maxLength={6} />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">4. Bank Account Details (for Earnings)</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Account Holder Name</label>
              <input className={FIELD} value={form.bank.accountHolder} onChange={(e) => setBank("accountHolder", e.target.value)} placeholder="As per bank passbook" />
            </div>
            <div>
              <label className={LABEL}>Bank Name</label>
              <input className={FIELD} value={form.bank.bankName} onChange={(e) => setBank("bankName", e.target.value)} placeholder="e.g. State Bank of India" />
            </div>
            <div>
              <label className={LABEL}>Account Number</label>
              <input className={FIELD} value={form.bank.accountNumber} onChange={(e) => setBank("accountNumber", e.target.value)} placeholder="1234567890" />
            </div>
            <div>
              <label className={LABEL}>IFSC Code</label>
              <input className={FIELD} value={form.bank.ifsc} onChange={(e) => setBank("ifsc", e.target.value)} placeholder="SBIN0001234" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#217346] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-60"
          >
            {submitting ? "Creating Farmer…" : "Register Farmer"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/vendor/all-farmers")}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
