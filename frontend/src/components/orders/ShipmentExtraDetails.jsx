export default function ShipmentExtraDetails({ shipment }) {
  const manual = shipment?.manualTracking;
  const showManual = Boolean(manual?.enabled) && (Boolean(manual?.note) || Boolean(manual?.evidenceUrl));
  const fallbackNote = shipment?.note;
  const fallbackEvidenceUrl = shipment?.evidenceUrl;
  const fallbackEvidenceName = shipment?.evidenceName;

  if (!showManual && !fallbackNote && !fallbackEvidenceUrl) {
    return null;
  }

  return (
    <div className="space-y-2 pt-1">
      {showManual ? (
        <>
          {manual.note ? (
            <p className="text-sm text-neutral-700">
              <span className="font-semibold text-neutral-900">Tracking update: </span>
              {manual.note}
            </p>
          ) : null}
          {manual.evidenceUrl ? (
            <p className="text-sm text-neutral-700">
              <span className="font-semibold text-neutral-900">Tracking photo: </span>
              <a
                href={manual.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {manual.evidenceName || "View photo"}
              </a>
            </p>
          ) : null}
        </>
      ) : null}
      {fallbackNote ? (
        <p className="text-sm text-neutral-700">
          <span className="font-semibold text-neutral-900">Shipment note: </span>
          {fallbackNote}
        </p>
      ) : null}
      {fallbackEvidenceUrl ? (
        <p className="text-sm text-neutral-700">
          <span className="font-semibold text-neutral-900">Shipment photo: </span>
          <a
            href={fallbackEvidenceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            {fallbackEvidenceName || "View photo"}
          </a>
        </p>
      ) : null}
    </div>
  );
}
