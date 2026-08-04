export const SHIPPING_SERVICES = [
  {
    id: "delhivery-air",
    label: "Delhivery Air",
    carrier: "delhivery",
    serviceMatchers: [/air/i, /express/i],
  },
  {
    id: "delhivery-surface-2kg",
    label: "Delhivery Surface 2kg+",
    carrier: "delhivery",
    serviceMatchers: [/surface/i, /2\s*kg|2kg/i],
  },
  {
    id: "delhivery-surface-5kg",
    label: "Delhivery Surface 5kg+",
    carrier: "delhivery",
    serviceMatchers: [/surface/i, /5\s*kg|5kg/i],
  },
  {
    id: "delhivery-surface-10kg",
    label: "Delhivery Surface 10kg+",
    carrier: "delhivery",
    serviceMatchers: [/surface/i, /10\s*kg|10kg/i],
  },
  {
    id: "delhivery-surface-20kg",
    label: "Delhivery Surface 20kg+",
    carrier: "delhivery",
    serviceMatchers: [/surface/i, /20\s*kg|20kg/i],
  },
  {
    id: "delhivery-surface-sp",
    label: "Delhivery Surface (SP)",
    carrier: "delhivery",
    serviceMatchers: [/surface/i, /\bsp\b|special/i],
  },
  {
    id: "xpressbees-surface",
    label: "XpressBees Surface",
    carrier: "xpressbees",
    serviceMatchers: [/surface/i],
  },
  {
    id: "ekart-air",
    label: "Ekart Air",
    carrier: "ekart",
    serviceMatchers: [/air/i, /express/i],
  },
  {
    id: "ekart-surface",
    label: "Ekart Surface",
    carrier: "ekart",
    serviceMatchers: [/surface/i],
  },
  {
    id: "amazon-standard",
    label: "Amazon Shipping Standard",
    carrier: "amazon",
    serviceMatchers: [/standard/i, /amazon/i, /ats/i, /shipping/i],
  },
];

export function getShippingServiceCarriers(services = SHIPPING_SERVICES) {
  return [...new Set(services.map((entry) => entry.carrier.toLowerCase()))];
}

function quoteHaystack(quote) {
  return `${quote.service || ""} ${quote.serviceDescription || ""}`.toLowerCase();
}

export function matchQuoteToShippingService(quotes, serviceDef) {
  const carrierQuotes = quotes.filter(
    (quote) => safeLower(quote.carrier) === safeLower(serviceDef.carrier)
  );

  if (!carrierQuotes.length) return null;

  const ranked = carrierQuotes
    .map((quote) => {
      const haystack = quoteHaystack(quote);
      const score = serviceDef.serviceMatchers.reduce(
        (sum, matcher) => sum + (matcher.test(haystack) ? 1 : 0),
        0
      );
      return { quote, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length) return ranked[0].quote;

  if (serviceDef.serviceMatchers.length === 1) {
    const fallback = carrierQuotes.find((quote) =>
      serviceDef.serviceMatchers[0].test(quoteHaystack(quote))
    );
    if (fallback) return fallback;
  }

  // Amazon service names vary in Envia responses — use the cheapest quote for that carrier.
  if (safeLower(serviceDef.carrier) === "amazon") {
    return carrierQuotes.reduce((best, quote) => {
      if (!best || quote.totalPrice < best.totalPrice) return quote;
      return best;
    }, null);
  }

  return carrierQuotes.length === 1 ? carrierQuotes[0] : null;
}

export function mapQuotesToShippingServices(quotes, services = SHIPPING_SERVICES) {
  return services.map((serviceDef) => ({
    ...serviceDef,
    quote: matchQuoteToShippingService(quotes, serviceDef),
  }));
}

export function normalizePackageWeight(weight, unit = "KG") {
  const value = Number(weight);
  if (!Number.isFinite(value) || value <= 0) {
    return { weight: 0, weightUnit: "KG" };
  }

  const normalizedUnit = String(unit || "KG").toUpperCase();
  if (normalizedUnit === "G" || normalizedUnit === "GRAM" || normalizedUnit === "GRAMS") {
    return { weight: value / 1000, weightUnit: "KG" };
  }

  return { weight: value, weightUnit: "KG" };
}

function safeLower(value) {
  return String(value || "").trim().toLowerCase();
}
