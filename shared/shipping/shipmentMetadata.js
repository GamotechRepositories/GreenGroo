function safeTrim(value) {
  return String(value ?? "").trim();
}

export function buildEnviaShipmentComments({
  shipmentNote = "",
  evidenceUrl = "",
  evidenceName = "",
} = {}) {
  const parts = [];
  const note = safeTrim(shipmentNote);
  const url = safeTrim(evidenceUrl);

  if (note) {
    parts.push(note);
  }

  if (url) {
    const label = safeTrim(evidenceName) || "Shipment evidence";
    parts.push(`${label}: ${url}`);
  }

  return parts.join(" | ").slice(0, 500);
}

export function hasShipmentMetadata({ shipmentNote = "", evidenceUrl = "" } = {}) {
  return Boolean(safeTrim(shipmentNote) || safeTrim(evidenceUrl));
}
