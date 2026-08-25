import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Search,
  RefreshCw,
  Store,
  Pencil,
  ExternalLink,
  Loader2,
  X,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
} from 'lucide-react';
import darkStoreApi from '../api/darkStoreApi';

const DEFAULT_LAT = 18.559;
const DEFAULT_LNG = 73.7868;

const emptyForm = {
  storeName: '',
  name: '',
  state: '',
  city: '',
  area: '',
  storeAddress: '',
  latitude: '',
  longitude: '',
  geofenceRadius: 500,
  isActive: true,
};

function isDefaultPin(store) {
  const lat = Number(store?.latitude);
  const lng = Number(store?.longitude);
  return Math.abs(lat - DEFAULT_LAT) < 0.001 && Math.abs(lng - DEFAULT_LNG) < 0.001;
}

function mapsUrl(store) {
  const lat = Number(store?.latitude);
  const lng = Number(store?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(lat),
    lon: String(lng),
    zoom: '18',
    addressdetails: '1',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;
  const data = await response.json();
  const addr = data?.address || {};
  return {
    city: addr.city || addr.town || addr.village || addr.county || '',
    state: addr.state || '',
    area: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.village || '',
    storeAddress: data?.display_name || '',
  };
}

function StoreFormFields({ form, onChange, inputClass }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Store name
          <input
            name="storeName"
            value={form.storeName}
            onChange={onChange}
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Manager name
          <input name="name" value={form.name} onChange={onChange} className={inputClass} />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          State
          <input name="state" value={form.state} onChange={onChange} className={inputClass} />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          City
          <input name="city" value={form.city} onChange={onChange} className={inputClass} />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Area / locality
          <input name="area" value={form.area} onChange={onChange} className={inputClass} />
        </label>
      </div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        Store address
        <textarea
          name="storeAddress"
          rows={2}
          value={form.storeAddress}
          onChange={onChange}
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Latitude
          <input
            name="latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={onChange}
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Longitude
          <input
            name="longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={onChange}
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Service radius (m)
          <input
            name="geofenceRadius"
            type="number"
            min={50}
            max={50000}
            value={form.geofenceRadius}
            onChange={onChange}
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          name="isActive"
          checked={form.isActive}
          onChange={onChange}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        Store is active and can receive orders
      </label>
    </div>
  );
}

export default function DarkStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await darkStoreApi.list();
      setStores(data.stores || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dark stores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stores.filter((store) => {
      if (statusFilter === 'active' && !store.isActive) return false;
      if (statusFilter === 'inactive' && store.isActive) return false;
      if (!q) return true;
      return [
        store.storeName,
        store.name,
        store.email,
        store.phone,
        store.city,
        store.area,
        store.state,
        store.storeAddress,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [stores, search, statusFilter]);

  const openEdit = (store) => {
    setEditing(store);
    setForm({
      storeName: store.storeName || '',
      name: store.name || '',
      state: store.state || '',
      city: store.city || '',
      area: store.area || '',
      storeAddress: store.storeAddress || '',
      latitude: store.latitude ?? '',
      longitude: store.longitude ?? '',
      geofenceRadius: store.geofenceRadius ?? 500,
      isActive: store.isActive !== false,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const applyDetected = async (lat, lng) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const geo = await reverseGeocode(lat, lng);
      if (!geo) return;
      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        city: geo.city || prev.city,
        state: geo.state || prev.state,
        area: geo.area || prev.area,
        storeAddress: geo.storeAddress || prev.storeAddress,
      }));
    } catch {
      // coords still applied
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Location is not supported in this browser');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await applyDetected(position.coords.latitude, position.coords.longitude);
        setDetecting(false);
      },
      () => {
        setDetecting(false);
        showToast('Allow location access to set this store pin');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const saveLocation = async (e) => {
    e.preventDefault();
    if (!editing?.id) return;
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || form.latitude === "" || form.longitude === "") {
      showToast("Enter a valid latitude and longitude");
      return;
    }
    if (!form.city.trim() || !form.area.trim() || !form.state.trim()) {
      showToast("State, city and area are required");
      return;
    }
    setSaving(true);
    try {
      const data = await darkStoreApi.updateLocation(editing.id, {
        storeName: form.storeName,
        name: form.name,
        state: form.state,
        city: form.city,
        area: form.area,
        storeAddress: form.storeAddress,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        geofenceRadius: Number(form.geofenceRadius),
        isActive: form.isActive,
      });
      showToast(data.message || 'Store location updated');
      setEditing(null);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update store location');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Store className="h-3.5 w-3.5" /> Fulfilment
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dark Stores
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Every delivery manager hub. Change city, area, and map pin so customer orders route to the right store.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search store, city, area, manager…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            {['all', 'active', 'inactive'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${
                  statusFilter === key
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-400">
          {filtered.length} of {stores.length} stores
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <Store className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-base font-bold text-slate-800 dark:text-white">No dark stores found</h2>
          <p className="mt-1 text-sm text-slate-500">Register a delivery manager or clear the search.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((store) => {
            const unpinned = isDefaultPin(store);
            return (
              <article
                key={store.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-white">
                        {store.storeName}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          store.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {store.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {unpinned && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                          Default pin
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {[store.area, store.city, store.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(store)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit location
                  </button>
                </div>

                <p className="mt-3 line-clamp-2 text-xs text-slate-500">{store.storeAddress}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                    <p className="font-semibold uppercase tracking-wide text-slate-400">Coords</p>
                    <p className="mt-0.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                      {Number(store.latitude).toFixed(4)}, {Number(store.longitude).toFixed(4)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                    <p className="font-semibold uppercase tracking-wide text-slate-400">Radius</p>
                    <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-100">
                      {store.geofenceRadius || 500} m
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                    <p className="font-semibold uppercase tracking-wide text-slate-400">Catalog</p>
                    <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-100">
                      {store.inStockSkus || 0}/{store.skuCount || 0} SKUs
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                    <p className="font-semibold uppercase tracking-wide text-slate-400">Manager</p>
                    <p className="mt-0.5 truncate font-bold text-slate-800 dark:text-slate-100">
                      {store.name || '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {store.email}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {store.phone}
                  </span>
                  {mapsUrl(store) && (
                    <a
                      href={mapsUrl(store)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                    >
                      Open map <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={saveLocation}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Change store location</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Orders near this pin and area are assigned to this dark store.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={detecting}
              className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              {detecting ? 'Detecting…' : 'Use current location'}
            </button>

            <StoreFormFields form={form} onChange={handleChange} inputClass={inputClass} />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save location'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
