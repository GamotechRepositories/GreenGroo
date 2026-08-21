import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createManagerFarmer } from "../../api/farmerApi";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";
import toast from "react-hot-toast";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
];

export default function ManagerAddFarmerPage() {
  const navigate = useNavigate();
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
    status: "Active",
    address: { village: "", taluka: "", district: "", state: "Maharashtra", pincode: "" },
    bank: { accountHolder: "", bankName: "", accountNumber: "", ifsc: "" },
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAddr = (k, v) => setForm((f) => ({ ...f, address: { ...f.address, [k]: v } }));
  const setBank = (k, v) => setForm((f) => ({ ...f, bank: { ...f.bank, [k]: v } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim()) {
      toast.error("Farmer Name and Mobile Number are required");
      return;
    }
    if (form.mobile.trim().length !== 10) {
      toast.error("Mobile number must be 10 digits");
      return;
    }
    setSubmitting(true);
    try {
      await createManagerFarmer(form);
      toast.success(`Farmer "${form.name}" created successfully!`);
      navigate("/farmer/manager/farmers");
    } catch (err) {
      toast.error(err?.message || "Failed to create farmer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Link to="/farmer/manager/farmers" className="hover:text-[#217346]">My Farmers</Link>
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">Add Farmer</span>
      </div>

      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Add New Farmer</h1>
        <p className={EXCEL_PAGE_SUB}>Register a new farmer under your management</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Details */}
        <div className={`${EXCEL_PANEL} p-4 space-y-3`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">1. Basic Information</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Farmer Name *</label>
              <input className={EXCEL_INPUT} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ramesh Patil" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Mobile Number *</label>
              <input className={EXCEL_INPUT} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="9876543210" maxLength={10} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Email Address</label>
              <input type="email" className={EXCEL_INPUT} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="farmer@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Login Password</label>
              <input type="text" className={EXCEL_INPUT} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Default: 123456" />
            </div>
          </div>
        </div>

        {/* Farm Info */}
        <div className={`${EXCEL_PANEL} p-4 space-y-3`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">2. Farm Details</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Farm Name</label>
              <input className={EXCEL_INPUT} value={form.farmName} onChange={(e) => set("farmName", e.target.value)} placeholder="e.g. Patil Organic Farms" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Farm Location / Village</label>
              <input className={EXCEL_INPUT} value={form.farmLocation} onChange={(e) => set("farmLocation", e.target.value)} placeholder="e.g. Nashik Rural" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Farm Area</label>
              <input className={EXCEL_INPUT} value={form.farmArea} onChange={(e) => set("farmArea", e.target.value)} placeholder="e.g. 5 Acres" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Farm Type</label>
              <select className={EXCEL_INPUT} value={form.farmType} onChange={(e) => set("farmType", e.target.value)}>
                <option value="Organic">Organic</option>
                <option value="Inorganic">Inorganic</option>
                <option value="Hydroponic">Hydroponic</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className={`${EXCEL_PANEL} p-4 space-y-3`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">3. Address</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Village</label>
              <input className={EXCEL_INPUT} value={form.address.village} onChange={(e) => setAddr("village", e.target.value)} placeholder="Village" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Taluka</label>
              <input className={EXCEL_INPUT} value={form.address.taluka} onChange={(e) => setAddr("taluka", e.target.value)} placeholder="Taluka" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">District</label>
              <input className={EXCEL_INPUT} value={form.address.district} onChange={(e) => setAddr("district", e.target.value)} placeholder="District" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">State</label>
              <select className={EXCEL_INPUT} value={form.address.state} onChange={(e) => setAddr("state", e.target.value)}>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Pincode</label>
              <input className={EXCEL_INPUT} value={form.address.pincode} onChange={(e) => setAddr("pincode", e.target.value)} placeholder="422001" maxLength={6} />
            </div>
          </div>
        </div>

        {/* Bank */}
        <div className={`${EXCEL_PANEL} p-4 space-y-3`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">4. Bank Details</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Account Holder Name</label>
              <input className={EXCEL_INPUT} value={form.bank.accountHolder} onChange={(e) => setBank("accountHolder", e.target.value)} placeholder="As per passbook" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Bank Name</label>
              <input className={EXCEL_INPUT} value={form.bank.bankName} onChange={(e) => setBank("bankName", e.target.value)} placeholder="e.g. Bank of Maharashtra" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">Account Number</label>
              <input className={EXCEL_INPUT} value={form.bank.accountNumber} onChange={(e) => setBank("accountNumber", e.target.value)} placeholder="1234567890" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1F2937]">IFSC Code</label>
              <input className={EXCEL_INPUT} value={form.bank.ifsc} onChange={(e) => setBank("ifsc", e.target.value)} placeholder="MAHB0001234" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`${EXCEL_BTN_PRIMARY} px-6 py-2`}
          >
            {submitting ? "Creating…" : "Register Farmer"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/farmer/manager/farmers")}
            className={`${EXCEL_BTN} px-6 py-2`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
