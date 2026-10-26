import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const FIELD = "w-full border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]";
const LABEL = "mb-1 block text-xs font-semibold text-gray-700";

const EMPTY = {
  zoneId: "",
  storeName: "",
  managerName: "",
  phone: "",
  email: "",
  password: "",
  state: "Maharashtra",
  city: "",
  area: "",
  pincode: "",
  storeAddress: "",
  latitude: "",
  longitude: "",
  notes: "",
};

export default function DarkStoreRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(EMPTY);
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectZone = (zoneId, list = zones) => {
    const zone = list.find((z) => z.id === zoneId);
    setForm((f) => ({ ...f, zoneId, state: zone?.state || f.state }));
  };

  useEffect(() => {
    let alive = true;
    vendorApi
      .getZones()
      .then((res) => {
        if (!alive) return;
        const list = res.data?.zones || [];
        setZones(list);
        const wanted = searchParams.get("zone");
        const initial = list.find((z) => z.id === wanted) || (list.length === 1 ? list[0] : null);
        if (initial) setForm((f) => ({ ...f, zoneId: initial.id, state: initial.state || f.state }));
      })
      .catch((err) => alive && setError(err?.response?.data?.message || "Failed to load your zones"))
      .finally(() => alive && setZonesLoading(false));
    return () => {
      alive = false;
    };
  }, [searchParams]);

  const selectedZone = zones.find((z) => z.id === form.zoneId);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not supported in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toFixed(6));
        set("longitude", pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Allow location access, or type latitude and longitude");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await vendorApi.createDarkStoreRequest(form);
      navigate("/vendor/dark-stores", { state: { sent: true } });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send request");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/vendor/dark-stores" className="hover:text-[#217346]">My Dark Stores</Link>
        <span>›</span>
        <span className="font-semibold text-gray-700">Request Dark Store</span>
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Request Dark Store</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          The request goes to admin for approval. Once approved, the dark store is created under your collection centre
          and its manager can log in to the Delivery Manager panel with this email/mobile and password.
        </p>
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      {!zonesLoading && zones.length === 0 ? (
        <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          You need an approved zone before requesting a dark store.{" "}
          <Link to="/vendor/zones" className="font-semibold underline">Create a zone</Link> and wait for admin approval.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">Zone</p>
        <div>
          <label className={LABEL}>Approved Zone *</label>
          <select
            className={FIELD}
            value={form.zoneId}
            onChange={(e) => selectZone(e.target.value)}
            disabled={zonesLoading || zones.length === 0}
            required
          >
            <option value="">{zonesLoading ? "Loading zones…" : "Select a zone"}</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} — {zone.state}
              </option>
            ))}
          </select>
          {selectedZone?.cities?.length ? (
            <p className="mt-1 text-[10px] text-gray-400">Cities: {selectedZone.cities.join(", ")}</p>
          ) : null}
        </div>

        <p className="pt-2 text-xs font-bold uppercase tracking-wide text-[#217346]">Store & Manager</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL}>Dark Store Name *</label>
            <input className={FIELD} value={form.storeName} onChange={(e) => set("storeName", e.target.value)} placeholder="Kothrud Store" required />
          </div>
          <div>
            <label className={LABEL}>Manager Name</label>
            <input className={FIELD} value={form.managerName} onChange={(e) => set("managerName", e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Manager Mobile *</label>
            <input className={FIELD} value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={10} required />
          </div>
          <div>
            <label className={LABEL}>Manager Email *</label>
            <input className={FIELD} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Login Password *</label>
            <input className={FIELD} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} minLength={6} placeholder="At least 6 characters" required />
          </div>
        </div>

        <p className="pt-2 text-xs font-bold uppercase tracking-wide text-[#217346]">Location</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={LABEL}>State *</label>
            <input className={FIELD} value={form.state} onChange={(e) => set("state", e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>City *</label>
            <input className={FIELD} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Pune" required />
          </div>
          <div>
            <label className={LABEL}>Area / Locality *</label>
            <input className={FIELD} value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="Kothrud" required />
          </div>
          <div>
            <label className={LABEL}>Pincode</label>
            <input className={FIELD} value={form.pincode} onChange={(e) => set("pincode", e.target.value)} maxLength={6} />
          </div>
          <div>
            <label className={LABEL}>Latitude</label>
            <input className={FIELD} type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Longitude</label>
            <input className={FIELD} type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <button type="button" onClick={useCurrentLocation} disabled={locating} className="border border-[#217346] px-3 py-1.5 text-xs font-semibold text-[#217346] disabled:opacity-60">
              {locating ? "Detecting…" : "Use current location"}
            </button>
          </div>
          <div className="sm:col-span-3">
            <label className={LABEL}>Store Address</label>
            <textarea className={`${FIELD} min-h-[64px] resize-y`} value={form.storeAddress} onChange={(e) => set("storeAddress", e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <label className={LABEL}>Note for Admin</label>
            <textarea className={`${FIELD} min-h-[56px] resize-y`} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Why this dark store is needed, expected orders, etc." />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={submitting || !form.zoneId} className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {submitting ? "Sending…" : "Send for Approval"}
          </button>
          <Link to="/vendor/dark-stores" className="border border-gray-200 px-4 py-2 text-xs">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
