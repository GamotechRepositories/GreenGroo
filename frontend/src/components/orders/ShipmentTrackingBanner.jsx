export default function ShipmentTrackingBanner({ shipment, className = "" }) {
  if (!shipment?.trackUrl) {
    return null;
  }

  return (
    <a
      href={shipment.trackUrl}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center rounded-lg bg-[#2874F0] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 ${className}`}
    >
      Open live tracking
    </a>
  );
}
