import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import CopyId, { formatVehicleId } from "../../components/ui/CopyId";

const FIELD = "w-full border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]";
const LABEL = "mb-1 block text-xs font-semibold text-gray-700";
const VEHICLE_TYPES = ["Bike", "Auto", "Van", "Tempo", "Truck"];

export default function DriverFormPage() {
  const { driverId } = useParams();
  const isEdit = Boolean(driverId);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    vehicleNumber: "",
    vehicleType: "Van",
    licenseNumber: "",
    assignedArea: "",
    address: "",
    documents: [],
    status: "Active",
    password: "",
    driverId: "",
    vehicleId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    vendorApi.getDriverById(driverId)
      .then((r) => {
        const d = r.data;
        setForm({
          name: d.name || "",
          mobile: d.mobile || "",
          vehicleNumber: d.vehicleNumber || "",
          vehicleType: d.vehicleType || "Van",
          licenseNumber: d.licenseNumber || "",
          assignedArea: d.assignedArea || "",
          address: d.address || "",
          documents: d.documents || [],
          status: d.status || "Active",
          password: "",
          driverId: d.id || d.driverId || "",
          vehicleId: d.vehicleId || "",
        });
      })
      .catch(() => setError("Driver not found"));
  }, [driverId, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("documents", [...(form.documents || []), reader.result]);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile) {
      setError("Name and mobile are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (isEdit) await vendorApi.updateDriver(driverId, payload);
      else await vendorApi.createDriver(payload);
      navigate("/vendor/drivers");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save driver");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/vendor/drivers" className="hover:text-[#217346]">All Drivers</Link>
        <span>›</span>
        <span className="font-semibold text-gray-700">{isEdit ? "Edit Driver" : "Add Driver"}</span>
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? "Edit Driver" : "Add Driver"}</h1>
        <p className="mt-0.5 text-sm text-gray-500">Drivers log in with mobile and password (default: driver123). Pickup confirmation stays with the farmer manager.</p>
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 bg-white p-6">
        {isEdit ? (
          <div className="grid grid-cols-1 gap-3 border border-gray-100 bg-gray-50 px-3 py-2 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Driver ID</p>
              <CopyId value={form.driverId} className="mt-0.5" textClassName="font-mono text-xs font-semibold text-[#217346]" breakAll />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Vehicle ID</p>
              <CopyId value={formatVehicleId(form.vehicleId, form.vehicleNumber)} className="mt-0.5" textClassName="font-mono text-xs font-semibold text-[#217346]" breakAll />
            </div>
          </div>
        ) : null}
        <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">Driver Details</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Driver Name *</label>
            <input className={FIELD} value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Mobile Number *</label>
            <input className={FIELD} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} maxLength={10} required />
          </div>
          <div>
            <label className={LABEL}>Vehicle Number</label>
            <input className={FIELD} value={form.vehicleNumber} onChange={(e) => set("vehicleNumber", e.target.value)} placeholder="MH12 AB 1234" />
          </div>
          <div>
            <label className={LABEL}>Vehicle Type</label>
            <select className={FIELD} value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)}>
              {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Driving License</label>
            <input className={FIELD} value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Assigned Area</label>
            <input className={FIELD} value={form.assignedArea} onChange={(e) => set("assignedArea", e.target.value)} placeholder="Pune East" />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Address</label>
            <textarea
              className={`${FIELD} min-h-[72px] resize-y`}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="House / street, village, city, pincode"
            />
          </div>
          <div>
            <label className={LABEL}>Status</label>
            <select className={FIELD} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {["Active", "Inactive", "On Duty", "Off Duty"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>{isEdit ? "New Password (optional)" : "Login Password"}</label>
            <input className={FIELD} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder={isEdit ? "Leave blank to keep" : "driver123"} />
          </div>
        </div>
        <div>
          <label className={LABEL}>License / Documents</label>
          <input type="file" accept="image/*,.pdf" onChange={onFile} className="text-xs" />
          <p className="mt-1 text-[10px] text-gray-400">{form.documents?.length || 0} file(s) attached</p>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {submitting ? "Saving…" : isEdit ? "Save Driver" : "Add Driver"}
          </button>
          <Link to="/vendor/drivers" className="border border-gray-200 px-4 py-2 text-xs">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
