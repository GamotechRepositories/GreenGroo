/**
 * Google Maps JavaScript API dynamic loader & helpers
 */

let loadPromise = null;

export function getGoogleMapsApiKey() {
  return (
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAP_API_KEY ||
    ""
  ).trim();
}

/**
 * Dynamically loads the Google Maps JavaScript API script once.
 * Returns a Promise that resolves to `window.google.maps`.
 */
export function loadGoogleMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps cannot be loaded on the server"));
  }

  // Already loaded
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  // Loading in flight
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const apiKey = getGoogleMapsApiKey();

    // Check if an existing script tag is already in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }
      existingScript.addEventListener("load", () => {
        if (window.google?.maps) resolve(window.google.maps);
        else reject(new Error("Google Maps loaded but window.google.maps is undefined"));
      });
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const callbackName = `__initGoogleMaps_${Date.now()}`;
    window[callbackName] = () => {
      delete window[callbackName];
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps initialized but window.google.maps is missing"));
      }
    };

    // Global auth failure handler
    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.warn("[GoogleMaps] Authentication failed or API key error. Check VITE_GOOGLE_MAPS_API_KEY.");
      if (typeof prevAuthFailure === "function") prevAuthFailure();
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.defer = true;

    const params = new URLSearchParams({
      loading: "async",
      libraries: "places,geometry",
      callback: callbackName,
    });
    if (apiKey) {
      params.set("key", apiKey);
    }

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.onerror = (err) => {
      loadPromise = null;
      delete window[callbackName];
      reject(new Error("Failed to load Google Maps script. Check your internet connection or API key."));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Reverse geocode a lat/lng using Google Maps Geocoder with maximum accuracy
 */
export async function googleReverseGeocode(lat, lng) {
  const maps = await loadGoogleMaps();
  const geocoder = new maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && Array.isArray(results) && results.length > 0) {
        // Find best result (prefer rooftop/premise or first with formatted address)
        const best = results[0];

        const getComponent = (components, types) => {
          if (!Array.isArray(components)) return "";
          const match = components.find((c) =>
            types.some((t) => c.types.includes(t))
          );
          return match?.long_name || "";
        };

        const premise = getComponent(best.address_components, [
          "premise",
          "subpremise",
          "establishment",
          "point_of_interest",
        ]);
        const route = getComponent(best.address_components, ["route", "street_address"]);
        const sublocality =
          getComponent(best.address_components, [
            "sublocality_level_1",
            "sublocality_level_2",
            "sublocality_level_3",
            "sublocality",
            "neighborhood",
          ]);
        const city =
          getComponent(best.address_components, ["locality"]) ||
          getComponent(best.address_components, ["administrative_area_level_2"]) ||
          "";
        const state = getComponent(best.address_components, ["administrative_area_level_1"]) || "";

        // Look for postal code across results if first result lacks it
        let pincode = getComponent(best.address_components, ["postal_code"]);
        if (!pincode) {
          for (const r of results) {
            const p = getComponent(r.address_components, ["postal_code"]);
            if (p) {
              pincode = p;
              break;
            }
          }
        }

        const area = [premise || route, sublocality || city].filter(Boolean).join(", ") || sublocality || city;
        const label = [sublocality || area, city].filter(Boolean).join(", ") || "Pinned location";
        const formattedAddress = best.formatted_address || [area, city, state, pincode].filter(Boolean).join(", ");

        resolve({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          address: formattedAddress,
          area: area || city,
          city,
          state,
          pincode,
          label,
        });
      } else {
        reject(new Error(`Google Geocoder status: ${status}`));
      }
    });
  });
}
