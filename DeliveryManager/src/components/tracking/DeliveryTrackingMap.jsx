import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Google encoded-polyline → [[lat, lng], ...] (the backend uses this format for every route). */
export function decodePolyline(encoded = "") {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of ["lat", "lng"]) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index < encoded.length);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === "lat") lat += delta;
      else lng += delta;
    }
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

const pin = (emoji, bg) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${bg};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const ICONS = {
  store: pin("🏪", "#059669"),
  customer: pin("🏠", "#e11d48"),
  rider: pin("🛵", "#2563eb"),
};

const validPoint = (p) =>
  p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng));

/**
 * Store, customer and live rider on one OpenStreetMap map, with the route line.
 * The rider marker moves in place on every GPS update without re-fitting the view.
 */
export default function DeliveryTrackingMap({ store, destination, rider, polyline, className = "h-72" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({});
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);
    map.setView([18.52, 73.85], 12);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
      fittedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;

    const placeMarker = (key, point, label) => {
      if (!validPoint(point)) {
        if (layers[key]) {
          layers[key].remove();
          delete layers[key];
        }
        return;
      }
      const latLng = [Number(point.lat), Number(point.lng)];
      if (layers[key]) layers[key].setLatLng(latLng);
      else layers[key] = L.marker(latLng, { icon: ICONS[key] }).addTo(map).bindTooltip(label);
    };

    placeMarker("store", store, store?.name || "Dark store");
    placeMarker("customer", destination, "Customer");
    placeMarker("rider", rider, "Delivery partner");

    if (layers.route) {
      layers.route.remove();
      delete layers.route;
    }
    const routePoints = polyline ? decodePolyline(polyline) : [];
    if (routePoints.length > 1) {
      layers.route = L.polyline(routePoints, { color: "#2563eb", weight: 4, opacity: 0.75, dashArray: "6 8" }).addTo(map);
    }

    if (!fittedRef.current) {
      const bounds = [store, destination, rider]
        .filter(validPoint)
        .map((p) => [Number(p.lat), Number(p.lng)]);
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
        fittedRef.current = true;
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 15);
        fittedRef.current = true;
      }
    }
  }, [store, destination, rider, polyline]);

  return <div ref={containerRef} className={`w-full rounded-xl border border-slate-200 ${className}`} />;
}
