export function normalizeVideoUrlInput(value) {
  if (value == null) return "";
  return String(value).trim();
}

export function isValidHttpUrl(value) {
  const trimmed = normalizeVideoUrlInput(value);
  if (!trimmed) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeVideoUrlForSave(value) {
  const trimmed = normalizeVideoUrlInput(value);
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
}
