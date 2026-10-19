import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bike, Loader2, MapPin, Phone, Plus, ShieldCheck, Store, Trash2, X } from "lucide-react";
import { vendorApi } from "../../api/vendorApi";

const VEHICLE_OPTIONS = [
  { value: "motorcycle", label: "Motorcycle / Bike" },
  { value: "electric", label: "Electric Scooter / EV" },
  { value: "bicycle", label: "Bicycle" },
  { value: "van", label: "Delivery Van" },
];

export default function VendorDeliveryBoysPage() {
  const [riders, setRiders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    storeId: "",
    vehicleType: "motorcycle",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorApi.getDeliveryBoys();
      setRiders(res.data?.data || []);
      setStores(res.data?.stores || []);
      if (res.data?.stores?.length > 0 && !form.storeId) {
        setForm((prev) => ({ ...prev, storeId: res.data.stores[0].id }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load delivery boys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = () => {
    setFormError("");
    setForm({
      name: "",
      phone: "",
      password: "",
      storeId: stores[0]?.id || "",
      vehicleType: "motorcycle",
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await vendorApi.createDeliveryBoy(form);
      setSuccessMsg(`Delivery boy ${form.name} created successfully! They can now log in using phone ${form.phone}.`);
      setModalOpen(false);
      setTimeout(() => setSuccessMsg(""), 6000);
      await loadData();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to create delivery boy login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rider) => {
    if (!window.confirm(`Are you sure you want to remove delivery boy "${rider.name || rider.phone}"?`)) return;
    try {
      await vendorApi.deleteDeliveryBoy(rider.id);
      setSuccessMsg(`Delivery boy removed`);
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to remove delivery boy");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/vendor/dark-stores" className="hover:text-[#217346]">Dark Stores</Link>
            <span>›</span>
            <span className="font-medium text-gray-800">Delivery Boys</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Dark Store Delivery Boys</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Create and manage delivery riders for your approved dark stores. Riders use their mobile number and password to log in to the delivery partner app.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1.5 bg-[#217346] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1a5c37] transition"
        >
          <Plus className="h-4 w-4" />
          Add Delivery Boy
        </button>
      </div>

      {successMsg ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-center justify-between">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-rose-600 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Stores summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-gray-200 bg-white p-4 rounded-lg shadow-xs">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Store className="h-4 w-4 text-[#217346]" />
            <span>Approved Dark Stores</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
        </div>
        <div className="border border-gray-200 bg-white p-4 rounded-lg shadow-xs">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Bike className="h-4 w-4 text-emerald-600" />
            <span>Total Delivery Boys</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{riders.length}</p>
        </div>
        <div className="border border-gray-200 bg-white p-4 rounded-lg shadow-xs">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            <span>Status</span>
          </div>
          <p className="text-xs font-semibold text-emerald-700 mt-2">Logins Active & Verified</p>
        </div>
      </div>

      {/* Main Delivery Boys Table */}
      <section className="border border-gray-200 bg-white rounded-lg overflow-hidden shadow-xs">
        <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
            Delivery Boys List ({riders.length})
          </h2>
          <button
            type="button"
            onClick={loadData}
            className="text-xs text-gray-500 hover:text-gray-800 transition"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#217346]" />
            Loading delivery boys...
          </div>
        ) : riders.length === 0 ? (
          <div className="p-12 text-center">
            <Bike className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">No delivery boys added yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {stores.length === 0
                ? "You need an approved dark store first. Request a dark store from the Dark Stores tab to get started."
                : "Add your first delivery boy to start fulfilling orders from your approved dark stores."}
            </p>
            {stores.length === 0 ? (
              <Link
                to="/vendor/dark-stores/request"
                className="mt-3 inline-block bg-[#217346] text-white px-3.5 py-1.5 text-xs font-semibold rounded hover:bg-[#1a5c37]"
              >
                Request Dark Store
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleOpenModal}
                className="mt-3 bg-[#217346] text-white px-3.5 py-1.5 text-xs font-semibold rounded hover:bg-[#1a5c37]"
              >
                + Add Delivery Boy
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Delivery Boy</th>
                  <th className="px-4 py-3 font-semibold">Mobile / Login</th>
                  <th className="px-4 py-3 font-semibold">Assigned Dark Store</th>
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {riders.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{r.name || "Unnamed"}</div>
                      <div className="text-[10px] text-gray-400">ID: {r.id.slice(-6)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-800 font-mono text-[11px]">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {r.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 flex items-center gap-1">
                        <Store className="h-3 w-3 text-[#217346]" />
                        {r.storeName}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {r.storeAddress || r.area || r.city || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">
                      {r.vehicleType || "Motorcycle"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.status === "online" || r.status === "on_delivery"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            r.status === "online" || r.status === "on_delivery" ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {r.status === "on_delivery" ? "On Delivery" : r.status === "online" ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition"
                        title="Remove delivery boy"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Create Delivery Boy */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Add New Delivery Boy</h3>
                <p className="text-[11px] text-gray-500">Creates an active delivery partner login</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError ? (
              <div className="mb-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {formError}
              </div>
            ) : null}

            {stores.length === 0 ? (
              <div className="rounded border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-2">
                <p className="font-semibold">No approved dark store available.</p>
                <p>
                  According to GreenGrocc operational hierarchy, delivery boys must be assigned to an approved dark store.
                  Please request a dark store first and wait for admin approval.
                </p>
                <Link
                  to="/vendor/dark-stores/request"
                  className="inline-block mt-2 font-bold underline hover:text-amber-900"
                >
                  Go to Request Dark Store →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Assigned Dark Store <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.storeId}
                    onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded px-3 py-2 text-xs outline-none focus:border-[#217346]"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.storeName} — {s.area || s.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Delivery Boy Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name (e.g. Ramesh Patil)"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-xs outline-none focus:border-[#217346]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Mobile Number (Login Phone) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-xs outline-none focus:border-[#217346]"
                  />
                  <p className="mt-0.5 text-[10px] text-gray-400">Used as username in the delivery partner mobile app.</p>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Login Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-xs outline-none focus:border-[#217346]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-xs outline-none focus:border-[#217346]"
                  >
                    {VEHICLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 bg-[#217346] px-4 py-2 text-xs font-semibold text-white rounded hover:bg-[#1a5c37] disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Create Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
