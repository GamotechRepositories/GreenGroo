import { useEffect, useState } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { useLocation } from "../context/LocationContext";
import { useAuth } from "../context/AuthContext";
import { getAddresses, updateAddress, getActiveDarkStores } from "../api/api";
import {
  formatAddressLine,
  getAddressFullName,
  getAddressTypeTag,
  mapAddressToForm,
  sortAddressesByLatest,
} from "../utils/addressDisplay";
import AddressTagBadge from "../components/address/AddressTagBadge";
import AddressForm from "../components/address/AddressForm";
import { detectCurrentLocation, formatDeliveryLine } from "../utils/detectCurrentLocation";
import MapLocationPicker from "../components/address/MapLocationPicker";
import toast from "react-hot-toast";

function Location() {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { location, setLocation, hasLocation } = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [savedLocations, setSavedLocations] = useState([]);
  const [selected, setSelected] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [darkStores, setDarkStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // If redirected from login/signup or has state return path
  const returnTo = routerLocation.state?.returnTo || "/";

  useEffect(() => {
    let isMounted = true;
    if (user) {
      getAddresses()
        .then((res) => {
          if (!isMounted) return;
          const addrs = res.data?.data || res.data || [];
          const list = sortAddressesByLatest(Array.isArray(addrs) ? addrs : []);
          setSavedLocations(list);
          if (list.length > 0) {
            const matched = list.find((item) => {
              if (location?.lat != null && item.location?.lat != null) {
                return Math.abs(item.location.lat - location.lat) < 0.001;
              }
              if (item.pincode && location?.pincode && item.pincode === location.pincode) {
                return item.area === location.area || item.city === location.city;
              }
              return false;
            });
            setSelected(matched ? (matched._id || matched.id) : (list[0]._id || list[0].id));
          }
        })
        .catch(console.error);
    } else {
      setSavedLocations([]);
      setSelected("");
    }
    return () => {
      isMounted = false;
    };
  }, [user, location?.lat, location?.pincode, location?.area, location?.city]);

  useEffect(() => {
    let isMounted = true;
    setLoadingStores(true);
    getActiveDarkStores()
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data || [];
        setDarkStores(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (isMounted) setDarkStores([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const applyLocation = (next) => {
    const formatted = {
      label: next.label || next.area || next.city || next.shopName || "Delivery location",
      address: next.address || next.fullAddress || formatDeliveryLine(next),
      pincode: next.pincode || "",
      city: next.city || "",
      state: next.state || "",
      area: next.area || "",
      lat: next.lat ?? next.latitude,
      lng: next.lng ?? next.longitude,
      shopName: next.shopName || "",
      landmark: next.landmark || "",
      fullAddress: next.fullAddress || next.address || "",
    };
    setLocation(formatted);
    const target = (!returnTo || returnTo === "/location") ? "/" : returnTo;
    navigate(target, { replace: true });
  };

  const handleMapConfirm = (mapLocation) => {
    setIsMapOpen(false);
    applyLocation({
      ...mapLocation,
      label: mapLocation.label || mapLocation.area || mapLocation.city || "Pinned Location",
    });
  };

  const onUseCurrentLocation = async () => {
    setError("");
    setDetecting(true);
    try {
      const detected = await detectCurrentLocation();
      applyLocation(detected);
    } catch (err) {
      setError(err.message || "Allow location access to see nearby store inventory");
    } finally {
      setDetecting(false);
    }
  };

  const confirm = () => {
    const loc = savedLocations.find((item) => (item._id || item.id) === selected);
    if (loc) {
      applyLocation({
        label: loc.label || loc.area || loc.city || loc.shopName || getAddressFullName(loc) || "Delivery location",
        address: loc.fullAddress || formatAddressLine(loc),
        city: loc.city,
        area: loc.area || loc.streetArea,
        pincode: loc.pincode,
        state: loc.state,
        lat: loc.location?.lat,
        lng: loc.location?.lng,
        shopName: loc.shopName,
        landmark: loc.landmark,
        fullAddress: loc.fullAddress,
      });
      return;
    }
    if (hasLocation) {
      const target = (!returnTo || returnTo === "/location") ? "/" : returnTo;
      navigate(target, { replace: true });
      return;
    }
    if (darkStores.length > 0) {
      const store = darkStores[0];
      applyLocation({
        label: store.storeName || `${store.area} Dark Store`,
        address: store.address || `${store.area}, ${store.city}`,
        area: store.area,
        city: store.city,
        pincode: store.pincode,
        lat: store.latitude,
        lng: store.longitude,
        fullAddress: store.address || `${store.area}, ${store.city}`,
      });
      return;
    }
    toast.error("Please detect your location or select a store above");
  };

  const handleUpdateAddress = async (formData) => {
    if (!editingAddress) return;
    setSavingEdit(true);
    try {
      const editId = editingAddress._id || editingAddress.id;
      await updateAddress(editId, formData);
      const res = await getAddresses();
      const addrs = res.data?.data || res.data || [];
      const list = sortAddressesByLatest(Array.isArray(addrs) ? addrs : []);
      setSavedLocations(list);
      toast.success("Address and tag updated successfully!");
      setEditingAddress(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update address");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-mobile-bg pb-8 lg:flex lg:items-start lg:justify-center lg:bg-gradient-to-b lg:from-primary-light/20 lg:to-mobile-bg lg:px-8 lg:py-12">
      <div className="w-full lg:max-w-xl lg:overflow-hidden lg:rounded-3xl lg:border lg:border-border-light lg:bg-white lg:shadow-xl lg:shadow-primary/5">
        <div className="sticky top-0 z-10 border-b border-border-light bg-white px-4 py-4 sm:px-6 lg:static lg:px-8 lg:pt-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(returnTo || "/", { replace: true });
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-primary transition hover:bg-mobile-surface"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-primary lg:text-xl">Select Location</h1>
              <p className="text-xs text-text-secondary">Choose where to deliver your order</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 lg:px-8 lg:pb-8">
          {hasLocation && locationIsVisible(location) ? (
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-xs">
              <div className="min-w-0 pr-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Currently Delivering To
                </span>
                <span className="block truncate text-sm font-bold text-slate-900 mt-0.5">
                  {location.address || formatDeliveryLine(location)}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  {[location.area, location.city, location.pincode ? `PIN ${location.pincode}` : ""].filter(Boolean).join(" · ")}
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                Active
              </span>
            </div>
          ) : null}

          {isMapOpen ? (
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">Pin location on map</span>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(false)}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Close map
                </button>
              </div>
              <MapLocationPicker
                initialLocation={location?.lat && location?.lng ? location : null}
                onConfirm={handleMapConfirm}
                onCancel={() => setIsMapOpen(false)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onUseCurrentLocation}
                disabled={detecting}
                className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary-light/40 p-4 text-left transition hover:bg-primary-light/70 disabled:opacity-60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-text-primary">
                    {detecting ? "Detecting…" : "Use current location"}
                  </span>
                  <span className="block truncate text-xs text-text-secondary">
                    GPS detected area
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-primary/40 hover:bg-white hover:shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-text-primary">
                    Select on map
                  </span>
                  <span className="block truncate text-xs text-text-secondary">
                    Pin exact address
                  </span>
                </span>
              </button>
            </div>
          )}

          {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}

          {/* Active Dark Stores / Service Areas */}
          {darkStores.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-text-primary">
                    Select by Dark Store / Area
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Pick a store to view its local inventory & products
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {darkStores.length} Stores Available
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {darkStores.map((store) => {
                  const isCurrentStore =
                    location?.area &&
                    store.area &&
                    (location.area.toLowerCase() === store.area.toLowerCase() ||
                      (store.latitude && location.lat && Math.abs(store.latitude - location.lat) < 0.01));

                  return (
                    <button
                      key={store.id || store.storeName}
                      type="button"
                      onClick={() => {
                        applyLocation({
                          label: store.storeName || `${store.area} Dark Store`,
                          address: store.address || `${store.area}, ${store.city}`,
                          area: store.area,
                          city: store.city,
                          pincode: store.pincode,
                          lat: store.latitude,
                          lng: store.longitude,
                          fullAddress: store.address || `${store.area}, ${store.city}`,
                        });
                      }}
                      className={`group flex items-start gap-3 rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                        isCurrentStore
                          ? "border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500/30"
                          : "border-slate-200 bg-white hover:border-emerald-500/50 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 text-lg group-hover:scale-105 transition-transform">
                        🏪
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {store.area || store.storeName}
                          </span>
                          {isCurrentStore && (
                            <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {store.storeName} · {store.city}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-emerald-600">
                            {store.inStockCount > 0
                              ? `${store.inStockCount} items in stock`
                              : "Store active"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {savedLocations.length > 0 ? (
            <>
              <div className="mb-3 mt-6 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Saved locations
                </p>
                <span className="text-[11px] font-medium text-text-muted">
                  Latest 3 addresses
                </span>
              </div>

              <ul className="space-y-2.5">
                {savedLocations.slice(0, 3).map((loc, index) => {
                  const id = loc._id || loc.id;
                  const isSelected = selected === id;
                  const tag = getAddressTypeTag(loc, index);
                  return (
                    <li
                      key={id}
                      className={`relative rounded-2xl border transition ${
                        isSelected
                          ? "border-primary bg-primary-light/40 shadow-sm ring-1 ring-primary/30"
                          : "border-border-light bg-white hover:border-primary/40 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <button
                          type="button"
                          onClick={() => setSelected(id)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition cursor-pointer ${
                            isSelected ? "border-primary bg-primary text-white" : "border-border-light hover:border-primary"
                          }`}
                          aria-label="Select address"
                        >
                          {isSelected ? (
                            <svg className="h-3 w-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </button>

                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => setSelected(id)}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <AddressTagBadge tag={tag} />
                              <p className="font-bold text-text-primary">
                                {getAddressFullName(loc) || loc.label || tag}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress(loc);
                              }}
                              className="text-xs font-semibold text-primary hover:text-primary-dark underline cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>

                          <p className="mt-1 text-sm text-text-secondary leading-snug">
                            {formatAddressLine(loc)}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            {[loc.area || loc.streetArea, loc.city, loc.pincode ? `PIN ${loc.pincode}` : ""].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          <button
            type="button"
            onClick={confirm}
            className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark lg:py-4 cursor-pointer"
          >
            Confirm Location & Enter Store
          </button>
        </div>
      </div>

      {editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border-light pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">Edit Address & Tag</h3>
                <p className="text-xs text-text-secondary">Update details or change tag (Home, Office, Other)</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAddress(null)}
                className="text-xs font-bold text-text-secondary hover:text-text-primary p-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <AddressForm
              key={editingAddress._id || editingAddress.id}
              plain
              initial={mapAddressToForm(editingAddress)}
              onSubmit={handleUpdateAddress}
              onCancel={() => setEditingAddress(null)}
              submitting={savingEdit}
              existingAddresses={savedLocations}
              editingId={editingAddress._id || editingAddress.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function locationIsVisible(location) {
  return Boolean(location?.city || location?.pincode || location?.address);
}

export default Location;
