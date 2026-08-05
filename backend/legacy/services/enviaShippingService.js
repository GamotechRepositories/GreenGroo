import axios from "axios";

import StoreSettings from "../models/StoreSettings.js";
import { normalizePackageWeight } from "../../shared/shipping/shippingServices.js";
import {
  mergeEnviaOriginDefaults,
  buildEnviaOriginStreet,
  extractEnviaStreetNumber,
} from "../../shared/shipping/enviaOriginAddress.js";
import { buildEnviaCodAdditionalServices, resolveShipmentPaymentOptions } from "../../shared/shipping/shipmentPayment.js";
import { buildEnviaShipmentComments } from "../../shared/shipping/shipmentMetadata.js";

const TEST_BASE_URL = "https://api-test.envia.com";
const PROD_BASE_URL = "https://api.envia.com";
const GEOCODE_BASE_URL = "https://geocodes.envia.com";

const INDIA_STATE_ALIASES = {
  "andhra pradesh": "AP",
  "arunachal pradesh": "AR",
  assam: "AS",
  bihar: "BR",
  chhattisgarh: "CG",
  goa: "GA",
  gujarat: "GJ",
  haryana: "HR",
  "himachal pradesh": "HP",
  jharkhand: "JH",
  karnataka: "KA",
  kerala: "KL",
  "madhya pradesh": "MP",
  maharashtra: "MH",
  maharastra: "MH",
  manipur: "MN",
  meghalaya: "ML",
  mizoram: "MZ",
  nagaland: "NL",
  odisha: "OR",
  orissa: "OR",
  punjab: "PB",
  rajasthan: "RJ",
  sikkim: "SK",
  "tamil nadu": "TN",
  telangana: "TG",
  tripura: "TR",
  "uttar pradesh": "UP",
  uttarakhand: "UT",
  "west bengal": "WB",
  delhi: "DL",
  "new delhi": "DL",
  "jammu and kashmir": "JK",
  ladakh: "LA",
  puducherry: "PY",
  pondicherry: "PY",
  chandigarh: "CH",
  ap: "AP",
  ar: "AR",
  as: "AS",
  br: "BR",
  cg: "CG",
  ga: "GA",
  gj: "GJ",
  hr: "HR",
  hp: "HP",
  jh: "JH",
  ka: "KA",
  kl: "KL",
  mp: "MP",
  mh: "MH",
  mn: "MN",
  ml: "ML",
  mz: "MZ",
  nl: "NL",
  or: "OR",
  pb: "PB",
  rj: "RJ",
  sk: "SK",
  tn: "TN",
  tg: "TG",
  tr: "TR",
  up: "UP",
  ut: "UT",
  wb: "WB",
  dl: "DL",
  jk: "JK",
  la: "LA",
  py: "PY",
  ch: "CH",
};

const pincodeGeoCache = new Map();

function safeTrim(value) {
  return String(value || "").trim();
}

function toPositiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeIndiaPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (String(phone || "").trim().startsWith("+")) return String(phone).trim();
  return String(phone || "").trim();
}

function lookupIndiaStateAlias(state) {
  const normalized = safeTrim(state).toLowerCase();
  if (!normalized) return "";
  if (/^[a-z]{2}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }
  return INDIA_STATE_ALIASES[normalized] || "";
}

async function lookupIndiaPincode(postalCode) {
  const pin = safeTrim(postalCode);
  if (!/^\d{6}$/.test(pin)) {
    return null;
  }

  if (pincodeGeoCache.has(pin)) {
    return pincodeGeoCache.get(pin);
  }

  try {
    const response = await axios.get(`${GEOCODE_BASE_URL}/zipcode/IN/${pin}`, {
      timeout: 8_000,
    });
    const row = Array.isArray(response.data) ? response.data[0] : null;
    if (!row) {
      pincodeGeoCache.set(pin, null);
      return null;
    }

    const details = {
      postalCode: pin,
      city: safeTrim(row.locality),
      stateCode: safeTrim(row.state?.code?.["2digit"]),
      stateName: safeTrim(row.state?.name),
      suburbs: Array.isArray(row.suburbs)
        ? row.suburbs.map((entry) => safeTrim(entry)).filter(Boolean)
        : [],
    };
    pincodeGeoCache.set(pin, details);
    return details;
  } catch {
    pincodeGeoCache.set(pin, null);
    return null;
  }
}

function resolveIndiaCityForEnvia(cityInput, geo) {
  const city = safeTrim(cityInput);
  if (!geo?.city) {
    return city;
  }

  const locality = geo.city.toLowerCase();
  if (!city) {
    return geo.city;
  }

  if (city.toLowerCase() === locality) {
    return geo.city;
  }

  const suburbMatch = geo.suburbs.some(
    (suburb) => suburb.toLowerCase() === city.toLowerCase()
  );
  if (suburbMatch) {
    return geo.city;
  }

  return geo.city;
}

async function resolveIndiaStateCode(state, postalCode) {
  const geo = await lookupIndiaPincode(postalCode);
  if (geo?.stateCode) {
    return geo.stateCode;
  }

  const alias = lookupIndiaStateAlias(state);
  if (alias) {
    return alias;
  }

  return safeTrim(state);
}

function formatEnviaShipmentError(message, context = {}) {
  const normalized = safeTrim(message);
  const pinMatch = normalized.match(/(\d{6})\s+is non serviceable pincode/i);
  if (pinMatch) {
    const pin = pinMatch[1];
    const carrier = safeTrim(context.carrier) || "the selected carrier";
    return `Pincode ${pin} is not serviceable by ${carrier}. Compare rates again and choose a different shipping partner, or update the customer's delivery address.`;
  }

  if (/non serviceable pincode/i.test(normalized)) {
    const carrier = safeTrim(context.carrier) || "the selected carrier";
    return `${normalized} Try a different shipping partner with Compare rates, or verify the customer's pincode. Carrier: ${carrier}.`;
  }

  if (safeTrim(context.carrier) === "amazon") {
    if (/carrier.*not.*available|not enabled|not connected|unavailable/i.test(normalized)) {
      return `${normalized} Connect Amazon Shipping in your Envia account (Carriers → Amazon) and use production mode with a live API token.`;
    }
    if (/sandbox|test/i.test(normalized)) {
      return `${normalized} Amazon Shipping usually requires production Envia (disable sandbox in Store Settings).`;
    }
  }

  return normalized;
}

async function normalizeEnviaAddress(address = {}) {
  const country = safeTrim(address.country || "IN").toUpperCase();
  const postalCode = safeTrim(address.postalCode);
  let city = safeTrim(address.city);
  let state =
    country === "IN"
      ? lookupIndiaStateAlias(address.state)
      : safeTrim(address.state);

  if (country === "IN") {
    const geo = await lookupIndiaPincode(postalCode);
    if (geo) {
      city = resolveIndiaCityForEnvia(city, geo);
      state = geo.stateCode || state || (await resolveIndiaStateCode(address.state, postalCode));
    } else {
      state = await resolveIndiaStateCode(address.state, postalCode);
    }
  }

  return {
    ...address,
    name: safeTrim(address.name),
    company: safeTrim(address.company),
    email: safeTrim(address.email),
    phone: normalizeIndiaPhone(address.phone),
    street: safeTrim(address.street),
    number: safeTrim(address.number) || "1",
    reference: safeTrim(address.reference),
    city,
    state,
    country,
    postalCode,
  };
}

function extractEnviaError(error) {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }
  if (data?.error?.message) {
    return safeTrim(data.error.message);
  }
  if (data?.message) {
    return safeTrim(data.message);
  }
  if (Array.isArray(data?.data)) {
    const rowMessage = safeTrim(data.data[0]?.message || data.data[0]?.error);
    if (rowMessage) return rowMessage;
  }
  return safeTrim(error?.message) || "Envia shipment request failed";
}

async function resolveEnviaConfig() {
  const settings = await StoreSettings.findOne({ key: "store" }).lean();
  const envia = settings?.envia || {};

  const tokenFromEnv = safeTrim(process.env.ENVIA_API_TOKEN);
  const tokenFromSettings = safeTrim(envia.apiToken);
  const token = tokenFromEnv || tokenFromSettings;

  const useSandbox = process.env.ENVIA_USE_SANDBOX
    ? process.env.ENVIA_USE_SANDBOX === "true"
    : envia.useSandbox !== false;

  const enabled = process.env.ENVIA_FORCE_ENABLE
    ? process.env.ENVIA_FORCE_ENABLE === "true"
    : Boolean(envia.enabled);

  return {
    enabled,
    token,
    useSandbox,
    defaultCarrier: safeTrim(process.env.ENVIA_DEFAULT_CARRIER || envia.defaultCarrier),
    defaultService: safeTrim(process.env.ENVIA_DEFAULT_SERVICE || envia.defaultService),
    origin: mergeEnviaOriginDefaults({
      name: safeTrim(envia.origin?.name),
      company: safeTrim(envia.origin?.company),
      email: safeTrim(envia.origin?.email),
      phone: safeTrim(envia.origin?.phone),
      addressLine1: safeTrim(envia.origin?.addressLine1),
      addressLine2: safeTrim(envia.origin?.addressLine2),
      landmark: safeTrim(envia.origin?.landmark),
      streetNumber: safeTrim(envia.origin?.streetNumber),
      street: safeTrim(envia.origin?.street),
      city: safeTrim(envia.origin?.city),
      state: safeTrim(envia.origin?.state),
      country: safeTrim(envia.origin?.country || "IN").toUpperCase(),
      postalCode: safeTrim(envia.origin?.postalCode),
      isDefault: envia.origin?.isDefault !== false,
    }),
    packageDefaults: {
      type: safeTrim(envia.packageDefaults?.type || "box"),
      content: safeTrim(envia.packageDefaults?.content || "Mobile accessories"),
      amount: Math.max(1, Math.round(toPositiveNumber(envia.packageDefaults?.amount, 1))),
      weightUnit: safeTrim(envia.packageDefaults?.weightUnit || "KG").toUpperCase(),
      lengthUnit: safeTrim(envia.packageDefaults?.lengthUnit || "CM").toUpperCase(),
      weight: toPositiveNumber(envia.packageDefaults?.weight, 1),
      length: toPositiveNumber(envia.packageDefaults?.length, 20),
      width: toPositiveNumber(envia.packageDefaults?.width, 15),
      height: toPositiveNumber(envia.packageDefaults?.height, 10),
    },
    rateCarriers: normalizeRateCarriers(
      process.env.ENVIA_RATE_CARRIERS || envia.rateCarriers
    ),
  };
}

const DEFAULT_IN_RATE_CARRIERS = [
  "xpressbees",
  "delhivery",
  "ekart",
  "amazon",
  "bluedart",
  "dtdc",
  "ecomexpress",
];

function normalizeRateCarriers(raw) {
  if (Array.isArray(raw)) {
    const carriers = raw.map((entry) => safeTrim(entry)).filter(Boolean);
    return carriers.length ? carriers : [...DEFAULT_IN_RATE_CARRIERS];
  }
  if (typeof raw === "string" && raw.trim()) {
    const carriers = raw
      .split(/[,;\n]+/)
      .map((entry) => safeTrim(entry))
      .filter(Boolean);
    return carriers.length ? carriers : [...DEFAULT_IN_RATE_CARRIERS];
  }
  return [...DEFAULT_IN_RATE_CARRIERS];
}

export function parseShipmentOverrides(body = {}, order = null) {
  const weightInput = normalizePackageWeight(body.weight, body.weightUnit || "KG");
  const payment = resolveShipmentPaymentOptions(order || {}, body);

  return {
    carrier: safeTrim(body.carrier),
    service: safeTrim(body.service),
    packageType: safeTrim(body.packageType),
    content: safeTrim(body.content),
    amount: body.amount,
    weightUnit: weightInput.weightUnit,
    lengthUnit: safeTrim(body.lengthUnit) || "CM",
    weight: weightInput.weight,
    length: body.length,
    width: body.width,
    height: body.height,
    declaredValue: body.declaredValue,
    folio: safeTrim(body.folio),
    carriers: normalizeRateCarriers(body.carriers),
    isCod: payment.isCod,
    codAmount: payment.codAmount,
    shipmentNote: safeTrim(body.shipmentNote || body.note).slice(0, 500),
    evidenceUrl: safeTrim(body.evidenceUrl),
    evidenceName: safeTrim(body.evidenceName).slice(0, 200),
  };
}

function resolveCodCollectAmount(order, overrides = {}) {
  if (!overrides.isCod) {
    return 0;
  }

  const explicit = toPositiveNumber(overrides.codAmount, 0);
  if (explicit > 0) {
    return explicit;
  }

  const total = Number(order.total) || 0;
  const advance = Number(order.codAdvanceAmount) || 0;
  const remaining = Math.max(0, total - advance);
  return remaining > 0 ? remaining : total;
}

function buildCodAdditionalServices(order, overrides = {}) {
  const amount = resolveCodCollectAmount(order, overrides);
  const services = buildEnviaCodAdditionalServices({
    isCod: overrides.isCod,
    codAmount: amount,
  });

  if (overrides.isCod && !services) {
    throw new Error("COD collection amount is required for Cash on Delivery shipments");
  }

  return services;
}

function buildPackages(order, config, overrides = {}) {
  const defaults = config.packageDefaults;
  const additionalServices = buildCodAdditionalServices(order, overrides);
  const pkg = {
    type: safeTrim(overrides.packageType || defaults.type),
    content: safeTrim(overrides.content || defaults.content),
    amount: Math.max(1, Math.round(toPositiveNumber(overrides.amount, defaults.amount))),
    weightUnit: safeTrim(overrides.weightUnit || defaults.weightUnit).toUpperCase(),
    lengthUnit: safeTrim(overrides.lengthUnit || defaults.lengthUnit).toUpperCase(),
    weight: toPositiveNumber(overrides.weight, defaults.weight),
    dimensions: {
      length: toPositiveNumber(overrides.length, defaults.length),
      width: toPositiveNumber(overrides.width, defaults.width),
      height: toPositiveNumber(overrides.height, defaults.height),
    },
    declaredValue: toPositiveNumber(overrides.declaredValue, order.total || 1),
  };

  if (additionalServices) {
    pkg.additionalServices = additionalServices;
  }

  return [pkg];
}

async function buildShipmentAddresses(order, config) {
  const destination = mapAddressToDestination(order.deliveryAddress || {});
  const requiredDestination = ["name", "phone", "street", "city", "state", "postalCode"];
  const missing = requiredDestination.filter((key) => !safeTrim(destination[key]));
  if (missing.length) {
    throw new Error(`Order address is incomplete. Missing: ${missing.join(", ")}`);
  }

  const destinationGeo = await lookupIndiaPincode(destination.postalCode);
  if (!destinationGeo) {
    throw new Error(
      `Delivery pincode ${destination.postalCode} is not recognized by Envia. Ask the customer to verify their address.`
    );
  }

  const origin = mapOriginForEnvia(config.origin);
  const originGeo = await lookupIndiaPincode(origin.postalCode);
  if (!originGeo) {
    throw new Error(
      `Warehouse pincode ${origin.postalCode} is not recognized by Envia. Update the pickup address in Store Settings.`
    );
  }

  return {
    origin,
    destination,
  };
}

function buildClient(baseUrl, token) {
  return axios.create({
    baseURL: baseUrl,
    timeout: 25_000,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

function ensureConfigUsable(config) {
  if (!config.enabled) {
    throw new Error("Envia is disabled in store settings");
  }
  if (!config.token) {
    throw new Error("Envia API token is missing");
  }
  const requiredOrigin = ["name", "phone", "street", "city", "state", "country", "postalCode"];
  const missing = requiredOrigin.filter((key) => !safeTrim(config.origin[key]));
  if (missing.length) {
    throw new Error(`Envia origin is incomplete. Missing: ${missing.join(", ")}`);
  }
}

function mapAddressToDestination(address = {}) {
  const streetParts = [address.fullAddress, address.landmark].map(safeTrim).filter(Boolean);

  return {
    name: safeTrim(address.fullName),
    company: safeTrim(address.shopName),
    email: safeTrim(address.email),
    phone: normalizeIndiaPhone(address.number),
    street: streetParts.join(", ") || safeTrim(address.fullAddress),
    city: safeTrim(address.city),
    state: safeTrim(address.state),
    country: "IN",
    postalCode: safeTrim(address.pincode),
    number: safeTrim(address.shopNo) || "1",
    reference: safeTrim(address.landmark),
  };
}

function mapOriginForEnvia(origin = {}) {
  const street = buildEnviaOriginStreet(origin);

  return {
    name: safeTrim(origin.name),
    company: safeTrim(origin.company),
    email: safeTrim(origin.email),
    phone: safeTrim(origin.phone),
    street,
    number: extractEnviaStreetNumber(origin),
    city: safeTrim(origin.city),
    state: safeTrim(origin.state),
    country: safeTrim(origin.country || "IN").toUpperCase(),
    postalCode: safeTrim(origin.postalCode),
  };
}

async function buildShipmentPayload(order, config, overrides = {}) {
  const { origin, destination } = await buildShipmentAddresses(order, config);
  const packages = buildPackages(order, config, overrides);

  const carrier = safeTrim(overrides.carrier || config.defaultCarrier);
  const service = safeTrim(overrides.service || config.defaultService);
  if (!carrier || !service) {
    throw new Error("Carrier and service are required to create Envia shipment");
  }

  const enviaComments = buildEnviaShipmentComments(overrides);

  return {
    origin,
    destination,
    packages,
    settings: {
      currency: "INR",
      printFormat: "PDF",
      printSize: "STOCK_4X6",
      ...(enviaComments ? { comments: enviaComments } : {}),
    },
    shipment: {
      type: 1,
      carrier,
      service,
      folio: safeTrim(overrides.folio || order.orderNumber || ""),
    },
  };
}

async function buildRateQuotePayload(order, config, overrides = {}, carrier) {
  const { origin, destination } = await buildShipmentAddresses(order, config);
  const packages = buildPackages(order, config, overrides);

  return {
    origin,
    destination,
    packages,
    settings: {
      currency: "INR",
    },
    shipment: {
      type: 1,
      carrier: safeTrim(carrier),
    },
  };
}

async function postRateQuote(client, order, config, overrides, carrier) {
  const payload = await buildRateQuotePayload(order, config, overrides, carrier);
  payload.origin = await normalizeEnviaAddress(payload.origin);
  payload.destination = await normalizeEnviaAddress(payload.destination);
  const response = await client.post("/ship/rate/", payload);
  return pickRateQuotes(response.data, carrier);
}

async function quoteCarrierRates(client, order, config, overrides, carrier) {
  const withCod = Boolean(overrides.isCod);

  const attempt = async (codOverrides) => postRateQuote(client, order, config, codOverrides, carrier);

  try {
    let quotes = await attempt(overrides);
    if (quotes.length || !withCod) {
      return { quotes, error: null };
    }

    const prepaidOverrides = { ...overrides, isCod: false, codAmount: undefined };
    quotes = await attempt(prepaidOverrides);
    if (quotes.length) {
      return {
        quotes: quotes.map((quote) => ({ ...quote, codQuoteFallback: true })),
        error: null,
      };
    }

    return {
      quotes: [],
      error: "No rates returned for this pincode. Try another carrier.",
    };
  } catch (reason) {
    if (withCod) {
      try {
        const prepaidOverrides = { ...overrides, isCod: false, codAmount: undefined };
        const quotes = await attempt(prepaidOverrides);
        if (quotes.length) {
          return {
            quotes: quotes.map((quote) => ({ ...quote, codQuoteFallback: true })),
            error: null,
          };
        }
      } catch {
        // Fall through to the original carrier error.
      }
    }

    return {
      quotes: [],
      error: formatEnviaShipmentError(
        extractEnviaError(reason) || "Rate quote failed",
        { carrier }
      ),
    };
  }
}

function pickRateQuotes(responseData = {}, carrier = "") {
  const rows = Array.isArray(responseData?.data) ? responseData.data : [];
  return rows
    .map((row) => ({
      carrier: safeTrim(row.carrier || carrier),
      service: safeTrim(row.service),
      serviceDescription: safeTrim(
        row.serviceDescription || row.description || row.serviceName || row.service
      ),
      totalPrice: Number(row.totalPrice ?? row.total ?? row.price ?? 0),
      currency: safeTrim(row.currency || "INR"),
      deliveryEstimate: safeTrim(
        row.deliveryEstimate || row.deliveryDate || row.estimatedDelivery || ""
      ),
    }))
    .filter((row) => row.carrier && row.service);
}

function pickGeneratedShipmentData(responseData = {}) {
  if (responseData?.meta === "error" || responseData?.error) {
    throw new Error(extractEnviaError({ response: { data: responseData } }));
  }

  const row = Array.isArray(responseData?.data) ? responseData.data[0] : null;
  if (!row) {
    throw new Error("Envia did not return shipment data");
  }
  return {
    provider: "envia",
    carrier: safeTrim(row.carrier),
    service: safeTrim(row.service),
    shipmentId: safeTrim(row.shipmentId || row.folio || ""),
    trackingNumber: safeTrim(row.trackingNumber || row.guideNumber || ""),
    trackUrl: safeTrim(row.trackUrl || ""),
    labelUrl: safeTrim(row.label || ""),
    status: safeTrim(row.status || ""),
    statusMessage: safeTrim(row.message || ""),
    syncedAt: new Date(),
    events: [],
    raw: row,
  };
}

function pickTrackingData(responseData = {}, fallbackTracking = "") {
  const row = Array.isArray(responseData?.data) ? responseData.data[0] : null;
  if (!row) {
    throw new Error("Envia did not return tracking data");
  }

  const trackingEvents = Array.isArray(row.events || row.history)
    ? (row.events || row.history).map((event) => ({
        status: safeTrim(event.status || event.event || event.description),
        date: safeTrim(
          event.date || event.datetime || event.timestamp || event.createdAt
        ),
        location: safeTrim(event.location || event.city || ""),
        description: safeTrim(event.description || event.details || ""),
      }))
    : [];

  const latestEvent = trackingEvents[0] || trackingEvents[trackingEvents.length - 1] || null;

  return {
    status: safeTrim(row.status || row.currentStatus || latestEvent?.status || ""),
    statusMessage: safeTrim(
      row.message ||
        row.lastEvent ||
        latestEvent?.description ||
        latestEvent?.status ||
        ""
    ),
    trackUrl: safeTrim(row.trackUrl || ""),
    trackingNumber: safeTrim(row.trackingNumber || fallbackTracking),
    syncedAt: new Date(),
    events: trackingEvents,
    raw: row,
  };
}

export async function quoteEnviaShipmentRates(order, overrides = {}) {
  const config = await resolveEnviaConfig();
  ensureConfigUsable(config);

  const carriers = overrides.carriers?.length
    ? overrides.carriers
    : config.rateCarriers?.length
      ? config.rateCarriers
      : DEFAULT_IN_RATE_CARRIERS;

  const baseURL = config.useSandbox ? TEST_BASE_URL : PROD_BASE_URL;
  const client = buildClient(baseURL, config.token);

  const results = await Promise.allSettled(
    carriers.map((carrier) => quoteCarrierRates(client, order, config, overrides, carrier))
  );

  const quotes = [];
  const errors = [];

  results.forEach((result, index) => {
    const carrier = carriers[index];
    if (result.status === "fulfilled") {
      quotes.push(...result.value.quotes);
      if (result.value.error) {
        errors.push({ carrier, message: result.value.error });
      }
    } else {
      const message = formatEnviaShipmentError(
        extractEnviaError(result.reason) || "Rate quote failed",
        { carrier }
      );
      errors.push({ carrier, message });
    }
  });

  quotes.sort((a, b) => a.totalPrice - b.totalPrice);

  return { quotes, errors, carriers };
}

export async function createEnviaShipment(order, overrides = {}) {
  const config = await resolveEnviaConfig();
  ensureConfigUsable(config);

  const baseURL = config.useSandbox ? TEST_BASE_URL : PROD_BASE_URL;
  const client = buildClient(baseURL, config.token);
  const payload = await buildShipmentPayload(order, config, overrides);
  payload.origin = await normalizeEnviaAddress(payload.origin);
  payload.destination = await normalizeEnviaAddress(payload.destination);

  try {
    const response = await client.post("/ship/generate/", payload);
    return pickGeneratedShipmentData(response.data);
  } catch (error) {
    let message = formatEnviaShipmentError(extractEnviaError(error), {
      carrier: overrides.carrier,
      postalCode: payload.destination?.postalCode,
    });
    const authFailed = /auth/i.test(message) || error?.response?.status === 401;
    if (authFailed && config.useSandbox) {
      message +=
        " Your token works on production Envia, but sandbox mode is ON. Turn off \"Use sandbox\" in admin, or use a token from ship-test.envia.com.";
    } else if (authFailed && !config.useSandbox) {
      message +=
        " Use a production token from ship.envia.com, or enable sandbox and use a ship-test.envia.com token.";
    }
    throw new Error(message);
  }
}

export async function trackEnviaShipment(trackingNumber) {
  const config = await resolveEnviaConfig();
  ensureConfigUsable(config);
  const normalized = safeTrim(trackingNumber);
  if (!normalized) {
    throw new Error("Tracking number is required");
  }

  const baseURL = config.useSandbox ? TEST_BASE_URL : PROD_BASE_URL;
  const client = buildClient(baseURL, config.token);
  const response = await client.post("/ship/generaltrack/", {
    trackingNumbers: [normalized],
  });
  return pickTrackingData(response.data, normalized);
}

export function isRecoverableEnviaCancelError(message) {
  return /already\s*cancel|previously\s*cancel|not\s*found|does\s*not\s*exist|no\s*shipment|inexistent|invalid\s*tracking|cannot\s*find|unknown\s*tracking|voided|deleted/i.test(
    String(message || "")
  );
}

/** Cancel / void an Envia label (POST /ship/cancel/). */
export async function cancelEnviaShipment({
  carrier,
  trackingNumber,
  folio = "",
} = {}) {
  const config = await resolveEnviaConfig();
  ensureConfigUsable(config);

  const normalizedCarrier = safeTrim(carrier);
  const normalizedTracking = safeTrim(trackingNumber);
  if (!normalizedCarrier || !normalizedTracking) {
    throw new Error("Carrier and tracking number are required to cancel the Envia label");
  }

  const baseURL = config.useSandbox ? TEST_BASE_URL : PROD_BASE_URL;
  const client = buildClient(baseURL, config.token);
  const payload = {
    carrier: normalizedCarrier,
    trackingNumber: normalizedTracking,
  };
  const folioValue = safeTrim(folio);
  if (folioValue) {
    payload.folio = folioValue;
  }

  try {
    const response = await client.post("/ship/cancel/", payload);
    if (response.data?.meta === "error" || response.data?.error) {
      throw new Error(extractEnviaError({ response: { data: response.data } }));
    }
    return response.data;
  } catch (error) {
    throw new Error(
      formatEnviaShipmentError(extractEnviaError(error) || "Failed to cancel Envia label", {
        carrier: normalizedCarrier,
      })
    );
  }
}

function applyShipmentOnOrder(order, shipment) {
  order.shipment = {
    provider: shipment.provider || "envia",
    carrier: shipment.carrier || "",
    service: shipment.service || "",
    shipmentId: shipment.shipmentId || "",
    trackingNumber: shipment.trackingNumber || "",
    trackUrl: shipment.trackUrl || "",
    labelUrl: shipment.labelUrl || "",
    status: shipment.status || "",
    statusMessage: shipment.statusMessage || "",
    syncedAt: shipment.syncedAt || new Date(),
    events: Array.isArray(shipment.events) ? shipment.events : [],
  };
}

const QUERIES_TEST_BASE_URL = "https://queries-test.envia.com";
const QUERIES_PROD_BASE_URL = "https://queries.envia.com";

export function getEnviaWebhookPublicUrl() {
  const base = safeTrim(
    process.env.PUBLIC_API_URL || process.env.BACKEND_URL || process.env.API_BASE_URL
  );
  if (!base) return "";
  return `${base.replace(/\/$/, "")}/api/webhooks/envia`;
}

export async function listEnviaWebhooks() {
  const config = await resolveEnviaConfig();
  ensureConfigUsable(config);

  const baseURL = config.useSandbox ? QUERIES_TEST_BASE_URL : QUERIES_PROD_BASE_URL;
  const client = buildClient(baseURL, config.token);
  const response = await client.get("/webhooks");
  return response.data;
}

export async function registerEnviaTrackingWebhook(url) {
  const config = await resolveEnviaConfig();
  ensureConfigUsable(config);

  const webhookUrl = safeTrim(url);
  if (!webhookUrl) {
    throw new Error("Webhook URL is required");
  }

  const baseURL = config.useSandbox ? QUERIES_TEST_BASE_URL : QUERIES_PROD_BASE_URL;
  const client = buildClient(baseURL, config.token);
  const response = await client.post("/webhooks", {
    type_id: 3,
    url: webhookUrl,
    active: 1,
  });
  return response.data;
}
