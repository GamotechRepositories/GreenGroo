import { mapsLink, osmEmbedUrl } from "../hooks/useRiderLiveLocations";

/**
 * Live tracking card — only while order is in progress (not delivered).
 */
export default function LiveRiderTrack({
  riderName,
  riderPhone,
  location,
  customerLat,
  customerLng,
  statusLabel,
}) {
  const lat = location?.lat;
  const lng = location?.lng;
  const hasRider = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const embed = hasRider ? osmEmbedUrl(Number(lat), Number(lng)) : null;
  const riderMaps = hasRider ? mapsLink(Number(lat), Number(lng)) : null;
  const customerMaps =
    customerLat != null && customerLng != null
      ? mapsLink(Number(customerLat), Number(customerLng))
      : null;

  const updated =
    location?.updatedAt &&
    new Date(location.updatedAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-sky-700">
            Live delivery tracking
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">
            {riderName || "Assigned rider"}
            {riderPhone ? (
              <span className="ml-2 text-xs font-semibold text-slate-500">{riderPhone}</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-sky-800">
            {statusLabel || "In progress"} · updates only when rider GPS moves
          </p>
        </div>
        {updated ? (
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-sky-700 border border-sky-200">
            Last ping {updated}
          </span>
        ) : (
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-slate-500 border border-slate-200">
            Waiting for GPS…
          </span>
        )}
      </div>

      {embed ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-sky-200 bg-white">
          <iframe
            title="Rider live map"
            src={embed}
            className="h-56 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-600">
          Map appears when the delivery partner shares location (online / on trip).
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {riderMaps ? (
          <a
            href={riderMaps}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-sky-700"
          >
            Open rider on Maps
          </a>
        ) : null}
        {customerMaps ? (
          <a
            href={customerMaps}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          >
            Customer drop pin
          </a>
        ) : null}
        {hasRider ? (
          <span className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
            {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
