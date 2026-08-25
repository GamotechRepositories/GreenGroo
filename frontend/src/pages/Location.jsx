import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../context/LocationContext";
import { detectCurrentLocation, formatDeliveryLine } from "../utils/detectCurrentLocation";

const SAVED_LOCATIONS = [
  {
    id: "hinjawadi",
    label: "Hinjawadi",
    address: "Hinjawadi Phase 2, Pune",
    city: "Pune",
    area: "Hinjawadi Phase 2",
    pincode: "411057",
    lat: 18.5912,
    lng: 73.7389,
  },
  {
    id: "baner",
    label: "Baner",
    address: "Baner, Pune",
    city: "Pune",
    area: "Baner",
    pincode: "411045",
    lat: 18.559,
    lng: 73.7868,
  },
];

function Location() {
  const navigate = useNavigate();
  const { location, setLocation } = useLocation();
  const [selected, setSelected] = useState(SAVED_LOCATIONS[0].id);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");

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
    });
    navigate("/", { replace: true });
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
    const loc = SAVED_LOCATIONS.find((item) => item.id === selected) || SAVED_LOCATIONS[0];
    applyLocation(loc);
  };

  return (
    <div className="min-h-screen bg-mobile-bg pb-8 lg:flex lg:items-start lg:justify-center lg:bg-gradient-to-b lg:from-primary-light/20 lg:to-mobile-bg lg:px-8 lg:py-12">
      <div className="w-full lg:max-w-xl lg:overflow-hidden lg:rounded-3xl lg:border lg:border-border-light lg:bg-white lg:shadow-xl lg:shadow-primary/5">
        <div className="sticky top-0 z-10 border-b border-border-light bg-white px-4 py-4 sm:px-6 lg:static lg:px-8 lg:pt-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-primary transition hover:bg-mobile-surface"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-primary lg:text-xl">Select Location</h1>
              <p className="text-sm text-text-secondary">
                We’ll show only items in stock at your nearest dark store
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 lg:px-8 lg:pb-8">
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={detecting}
            className="flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary-light/40 px-4 py-3.5 text-left transition hover:bg-primary-light/70 disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-bold text-text-primary">
                {detecting ? "Detecting current location…" : "Use current location"}
              </span>
              <span className="block text-xs text-text-secondary">
                Match inventory from the nearest GreenGroo dark store
              </span>
            </span>
          </button>

          {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}

          {locationIsVisible(location) ? (
            <p className="mt-3 text-xs text-text-muted">
              Current: {formatDeliveryLine(location)}
            </p>
          ) : null}

          <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Saved locations
          </p>

          <ul className="space-y-2">
            {SAVED_LOCATIONS.map((loc) => (
              <li key={loc.id}>
                <button
                  type="button"
                  onClick={() => setSelected(loc.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                    selected === loc.id
                      ? "border-primary bg-primary-light/50 shadow-sm"
                      : "border-border-light bg-white hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected === loc.id ? "border-primary" : "border-border-light"
                    }`}
                  >
                    {selected === loc.id ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-text-primary">{loc.label}</p>
                    <p className="mt-0.5 text-sm text-text-secondary">{loc.address}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {loc.city} · PIN {loc.pincode}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

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
