import { useEffect, useRef } from "react";

const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    if (!document.querySelector("link[data-leaflet]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.setAttribute("data-leaflet", "true");
      document.head.appendChild(css);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Could not load map"));
    document.body.appendChild(script);
  });
}

export default function FarmLocationMap({ latitude, longitude, onPinChange, interactive = true }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        const start = {
          lat: Number.isFinite(Number(latitude)) ? Number(latitude) : DEFAULT_CENTER.lat,
          lng: Number.isFinite(Number(longitude)) ? Number(longitude) : DEFAULT_CENTER.lng,
        };
        const map = L.map(mapEl.current).setView([start.lat, start.lng], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);

        const marker = L.marker([start.lat, start.lng], { draggable: interactive }).addTo(map);
        if (interactive) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onPinChange?.({ latitude: pos.lat, longitude: pos.lng });
          });
          map.on("click", (e) => {
            marker.setLatLng(e.latlng);
            onPinChange?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
          });
        }

        mapRef.current = map;
        markerRef.current = marker;
        setTimeout(() => map.invalidateSize(), 200);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) return;
    const latlng = [Number(latitude), Number(longitude)];
    markerRef.current.setLatLng(latlng);
    mapRef.current.setView(latlng, Math.max(mapRef.current.getZoom(), 14));
  }, [latitude, longitude]);

  return (
    <div className="overflow-hidden border border-[#D4D4D4]">
      <div ref={mapEl} className="h-72 w-full bg-[#E8F0E8]" />
      {interactive ? (
        <p className="border-t border-[#D4D4D4] bg-[#F9F9F9] px-3 py-1.5 text-[11px] text-[#6B7280]">
          Tap the map or drag the pin to set the farm location. Exact GPS numbers are kept private.
        </p>
      ) : null}
    </div>
  );
}
