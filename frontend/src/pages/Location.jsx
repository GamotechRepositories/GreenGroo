import { useEffect, useState } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { useLocation } from "../context/LocationContext";
import { useAuth } from "../context/AuthContext";
import { getAddresses } from "../api/api";
import { formatAddressLine, getAddressFullName } from "../utils/addressDisplay";
import { detectCurrentLocation, formatDeliveryLine } from "../utils/detectCurrentLocation";
import MapLocationPicker from "../components/address/MapLocationPicker";

function Location() {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { location, setLocation } = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [savedLocations, setSavedLocations] = useState([]);
  const [selected, setSelected] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  // If redirected from login/signup or has state return path
  const returnTo = routerLocation.state?.returnTo || "/";

  // Require auth before selecting location
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true, state: { from: "/location", returnTo } });
    }
  }, [authLoading, user, navigate, returnTo]);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      getAddresses()
        .then((res) => {
          if (!isMounted) return;
          const addrs = res.data?.data || res.data || [];
          const list = Array.isArray(addrs) ? addrs : [];
          setSavedLocations(list);
          if (list.length > 0) {
            setSelected(list[0]._id || list[0].id);
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
  }, [user]);

  const applyLocation = (next) => {
    setLocation({
      label: next.label || next.area || next.city || "Delivery location",
      address: next.address || formatDeliveryLine(next),
      pincode: next.pincode || "",
      city: next.city || "",
      state: next.state || "",
      area: next.area || "",
      lat: next.lat ?? next.latitude,
      lng: next.lng ?? next.longitude,
      shopName: next.shopName || "",
      landmark: next.landmark || "",
      fullAddress: next.fullAddress || "",
    });
    navigate(returnTo, { replace: true });
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
        label: loc.label || getAddressFullName(loc),
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
    } else {
      navigate(returnTo, { replace: true });
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

          {locationIsVisible(location) ? (
            <p className="mt-3 text-xs text-text-muted">
              Current: {formatDeliveryLine(location)}
            </p>
          ) : null}

          {savedLocations.length > 0 ? (
            <>
              <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Saved locations
              </p>

              <ul className="space-y-2">
                {savedLocations.map((loc) => {
                  const id = loc._id || loc.id;
                  const isSelected = selected === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setSelected(id)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                          isSelected
                            ? "border-primary bg-primary-light/50 shadow-sm"
                            : "border-border-light bg-white hover:border-primary/40 hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? "border-primary" : "border-border-light"
                          }`}
                        >
                          {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary">
                            {loc.label || getAddressFullName(loc)}
                          </p>
                          <p className="mt-0.5 text-sm text-text-secondary">
                            {formatAddressLine(loc)}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            {loc.city} · PIN {loc.pincode}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          <button
            type="button"
            onClick={confirm}
            className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark lg:py-4"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}

function locationIsVisible(location) {
  return Boolean(location?.city || location?.pincode || location?.address);
}

export default Location;
