function stripShortDescriptionLabel(text) {
  return String(text || "")
    .replace(/^Short Description\s*/i, "")
    .trim();
}

function splitAsteriskBullets(text) {
  return String(text || "")
    .split(/\s*\*\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Turns admin-entered description text into paragraphs + bullet rows.
 * Supports "Short Description", "Key Features", and inline `* feature` lists.
 */
export function parseProductDescription(description) {
  const raw = String(description ?? "").trim();
  if (!raw) return null;

  const normalized = stripShortDescriptionLabel(raw);
  const keyFeaturesMatch = normalized.match(/\bKey Features\b/i);

  let intro = normalized;
  let featureSource = "";
  let hasKeyFeaturesHeading = false;

  if (keyFeaturesMatch) {
    hasKeyFeaturesHeading = true;
    const index = keyFeaturesMatch.index ?? 0;
    intro = normalized.slice(0, index).trim();
    featureSource = normalized.slice(index + keyFeaturesMatch[0].length).trim();
  }

  let bullets = featureSource ? splitAsteriskBullets(featureSource) : [];

  if (!bullets.length && /\*/.test(normalized)) {
    const parts = splitAsteriskBullets(normalized);
    if (parts.length > 1) {
      intro = parts[0];
      bullets = parts.slice(1);
    }
  }

  const paragraphs = intro
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    paragraphs,
    bullets,
    hasKeyFeaturesHeading: hasKeyFeaturesHeading && bullets.length > 0,
  };
}
