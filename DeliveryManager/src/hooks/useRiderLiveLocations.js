import { useEffect, useMemo, useState } from "react";
import { subscribeToSocketEvent } from "../services/socket";

/**
 * Live rider GPS for active deliveries / online assignment — socket only.
 * Does not reload the page; only updates a location map for watched rider IDs.
 *
 * @param {string[]} riderIds - riders to track (assigned / online for dispatch)
 * @param {boolean} enabled - false stops listening (e.g. order delivered)
 */
export function useRiderLiveLocations(riderIds = [], enabled = true) {
  const [locations, setLocations] = useState({});
  const key = useMemo(
    () =>
      [...new Set((riderIds || []).map((id) => String(id || "")).filter(Boolean))]
        .sort()
        .join("|"),
    [riderIds]
  );
  const watched = useMemo(
    () => new Set(key ? key.split("|") : []),
    [key]
  );

  useEffect(() => {
    if (!enabled || !watched.size) return undefined;

    const onLoc = (payload = {}) => {
      const riderId = String(payload.riderId || "");
      if (!riderId || !watched.has(riderId)) return;
      const loc = payload.location || {};
      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      setLocations((prev) => ({
        ...prev,
        [riderId]: {
          lat,
          lng,
          updatedAt: loc.updatedAt || new Date().toISOString(),
          name: payload.name || prev[riderId]?.name || "",
          status: payload.status || prev[riderId]?.status || "",
          activeOrderId: payload.activeOrderId || null,
        },
      }));
    };

    return subscribeToSocketEvent("rider_location_updated", onLoc);
  }, [enabled, key, watched]);

  return locations;
}

export function mapsLink(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function osmEmbedUrl(lat, lng, zoom = 15) {
  if (lat == null || lng == null) return null;
  const d = 0.01;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
}
