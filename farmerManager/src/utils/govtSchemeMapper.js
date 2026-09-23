const DEFAULT_SCHEME_IMAGE = "/categories/grains.webp";

const STATUS_LABELS = {
  active: "Active (अर्जासाठी खुले)",
  closing_soon: "Closing Soon (अंतिम तारीख जवळ)",
  upcoming: "Upcoming (लवकरच सुरू)",
  closed: "Closed",
};

function splitTextLines(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (!value) return [];
  return String(value)
    .split(/\r?\n|[•]|;|\|/)
    .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function mapDocuments(value) {
  if (Array.isArray(value)) {
    return value.map((doc) => {
      if (typeof doc === "string") {
        const name = doc.trim();
        return { name, required: !/optional/i.test(name) };
      }
      return {
        name: String(doc?.name || "").trim(),
        required: doc?.required !== false,
      };
    }).filter((doc) => doc.name);
  }

  return splitTextLines(value).map((name) => ({
    name,
    required: !/optional/i.test(name),
  }));
}

function computeDaysLeft(deadline) {
  if (!deadline) return null;
  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) return null;
  const diffMs = parsed - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function portalLabel(applyUrl) {
  if (!applyUrl) return "Contact Taluka Agriculture Office";
  try {
    const host = new URL(applyUrl).hostname.replace(/^www\./, "");
    if (/mahadbt/i.test(host)) return "MahaDBT Portal";
    return host;
  } catch {
    return "Government Portal";
  }
}

export function mapApiGovtScheme(row) {
  if (!row) return null;

  const id = row.id || row._id;
  if (!id) return null;

  const applyUrl = String(row.applyUrl || "").trim();
  const statusBadge = row.statusBadge || row.status || "active";
  const statusLabel = row.statusLabel || STATUS_LABELS[statusBadge] || statusBadge;
  const deadline = String(row.deadline || "").trim() || "—";

  return {
    id: String(id),
    title: row.title || "",
    shortName: row.shortName || row.title || "",
    description: row.description || "",
    image: row.image || DEFAULT_SCHEME_IMAGE,
    govtLevel: row.govtLevel || "Central",
    status: statusLabel,
    statusBadge,
    subsidyAmount: row.subsidyAmount || "—",
    maxBenefit: row.maxBenefit || "—",
    deadline,
    category: row.category || "Financial Benefit",
    eligibility: splitTextLines(row.eligibility),
    documents: mapDocuments(row.documents),
    applyUrl,
    daysLeft: computeDaysLeft(deadline === "—" ? "" : deadline),
    applicationInfo: {
      mode: applyUrl ? "Online" : "Offline / Contact Local Office",
      portalName: portalLabel(applyUrl),
      portalUrl: applyUrl,
      steps: applyUrl
        ? [
            "1. Visit the official portal link below and register or login with Aadhaar.",
            "2. Select this scheme and fill in farmer and land details.",
            "3. Upload required documents and submit the application.",
            "4. Track approval status on the same portal.",
          ]
        : ["Contact your Gram Sevak or Taluka Agriculture Office for application steps."],
      offlineContact: "",
    },
    importantDates: deadline && deadline !== "—"
      ? [{ label: "Application Deadline", date: deadline }]
      : [],
  };
}

export function mapApiGovtSchemes(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapApiGovtScheme).filter(Boolean);
}
