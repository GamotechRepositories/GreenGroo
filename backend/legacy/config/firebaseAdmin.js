import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── App instances (lazy-initialised) ────────────────────────────────────────
// "delivery"  → greengrocc-27df8  (delivery partner app)
// "customer"  → userapp-1ac3c     (customer app)

const _state = {
  delivery: { app: null, attempted: false, error: null },
  customer: { app: null, attempted: false, error: null },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function env(name) {
  return process.env[name]?.trim() || "";
}

function parseServiceAccount(raw, source) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Firebase Admin: invalid JSON in ${source} — ${error.message}`);
  }
}

function readServiceAccountFromFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return parseServiceAccount(fs.readFileSync(filePath, "utf8"), filePath);
}

function resolveConfiguredPath(configuredPath) {
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

// ─── Credential loaders ───────────────────────────────────────────────────────

/**
 * Delivery project credentials.
 * Priority: FIREBASE_* env vars → FIREBASE_SERVICE_ACCOUNT_JSON →
 *           FIREBASE_SERVICE_ACCOUNT_PATH → legacy/config/bulkserviceAccount.json
 */
function loadDeliveryCredentials() {
  const projectId   = env("FIREBASE_PROJECT_ID");
  const clientEmail = env("FIREBASE_CLIENT_EMAIL");
  let   privateKey  = env("FIREBASE_PRIVATE_KEY");

  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    return {
      serviceAccount: {
        type:                        env("FIREBASE_TYPE") || "service_account",
        project_id:                  projectId,
        private_key_id:              env("FIREBASE_PRIVATE_KEY_ID"),
        private_key:                 privateKey,
        client_email:                clientEmail,
        client_id:                   env("FIREBASE_CLIENT_ID"),
        auth_uri:                    env("FIREBASE_AUTH_URI")                     || "https://accounts.google.com/o/oauth2/auth",
        token_uri:                   env("FIREBASE_TOKEN_URI")                    || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: env("FIREBASE_AUTH_PROVIDER_X509_CERT_URL") || "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url:        env("FIREBASE_CLIENT_X509_CERT_URL"),
        universe_domain:             env("FIREBASE_UNIVERSE_DOMAIN") || "googleapis.com",
      },
      source: "FIREBASE_* env vars",
    };
  }

  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    return { serviceAccount: parseServiceAccount(inlineJson, "FIREBASE_SERVICE_ACCOUNT_JSON"), source: "FIREBASE_SERVICE_ACCOUNT_JSON" };
  }

  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (configuredPath) {
    const resolved = resolveConfiguredPath(configuredPath);
    const sa = readServiceAccountFromFile(resolved);
    if (sa) return { serviceAccount: sa, source: `FIREBASE_SERVICE_ACCOUNT_PATH (${resolved})` };
    console.error(`Firebase Admin (delivery): file not found — ${resolved}`);
    return null;
  }

  const defaultPath = path.resolve(__dirname, "bulkserviceAccount.json");
  const sa = readServiceAccountFromFile(defaultPath);
  return sa ? { serviceAccount: sa, source: "bulkserviceAccount.json" } : null;
}

/**
 * Customer project credentials — uses CUSTOMER_FIREBASE_* env vars.
 */
function loadCustomerCredentials() {
  const projectId   = env("CUSTOMER_FIREBASE_PROJECT_ID");
  const clientEmail = env("CUSTOMER_FIREBASE_CLIENT_EMAIL");
  let   privateKey  = env("CUSTOMER_FIREBASE_PRIVATE_KEY");

  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    return {
      serviceAccount: {
        type:                        env("CUSTOMER_FIREBASE_TYPE") || "service_account",
        project_id:                  projectId,
        private_key_id:              env("CUSTOMER_FIREBASE_PRIVATE_KEY_ID"),
        private_key:                 privateKey,
        client_email:                clientEmail,
        client_id:                   env("CUSTOMER_FIREBASE_CLIENT_ID"),
        auth_uri:                    env("CUSTOMER_FIREBASE_AUTH_URI")                     || "https://accounts.google.com/o/oauth2/auth",
        token_uri:                   env("CUSTOMER_FIREBASE_TOKEN_URI")                    || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: env("CUSTOMER_FIREBASE_AUTH_PROVIDER_X509_CERT_URL") || "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url:        env("CUSTOMER_FIREBASE_CLIENT_X509_CERT_URL"),
        universe_domain:             env("CUSTOMER_FIREBASE_UNIVERSE_DOMAIN") || "googleapis.com",
      },
      source: "CUSTOMER_FIREBASE_* env vars",
    };
  }

  const inlineJson = process.env.CUSTOMER_FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    return { serviceAccount: parseServiceAccount(inlineJson, "CUSTOMER_FIREBASE_SERVICE_ACCOUNT_JSON"), source: "CUSTOMER_FIREBASE_SERVICE_ACCOUNT_JSON" };
  }

  const configuredPath = process.env.CUSTOMER_FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (configuredPath) {
    const resolved = resolveConfiguredPath(configuredPath);
    const sa = readServiceAccountFromFile(resolved);
    if (sa) return { serviceAccount: sa, source: `CUSTOMER_FIREBASE_SERVICE_ACCOUNT_PATH (${resolved})` };
    console.error(`Firebase Admin (customer): file not found — ${resolved}`);
    return null;
  }

  const defaultPath = path.resolve(__dirname, "customerServiceAccount.json");
  const sa = readServiceAccountFromFile(defaultPath);
  return sa ? { serviceAccount: sa, source: "customerServiceAccount.json" } : null;
}

// ─── Generic initialiser ──────────────────────────────────────────────────────

function initApp(slot, credentialsFn, appName) {
  const state = _state[slot];

  if (state.app)      return state.app;
  if (state.attempted) {
    if (state.error) throw state.error;
    return null;
  }

  state.attempted = true;

  try {
    const credentials = credentialsFn();
    if (!credentials) {
      console.warn(`Firebase Admin (${appName}): credentials not configured — push skipped.`);
      return null;
    }

    console.log(`Firebase Admin (${appName}): loading from ${credentials.source}`);

    // firebase-admin keeps a global app registry; look up by name to avoid
    // "app already exists" errors on hot-reload / re-import.
    let app;
    try {
      app = admin.app(appName);          // throws if not found
    } catch {
      app = admin.initializeApp(
        { credential: admin.cert(credentials.serviceAccount) },
        appName
      );
    }

    state.app = app;
    console.log(`Firebase Admin (${appName}): initialized ✓`);
    return app;
  } catch (error) {
    state.error = error;
    console.error(`Firebase Admin (${appName}) failed:`, error.message);
    throw error;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Firebase Admin app for the DELIVERY partner project (greengrocc-27df8). */
export function getDeliveryFirebaseAdmin() {
  return initApp("delivery", loadDeliveryCredentials, "delivery");
}

/** Firebase Admin app for the CUSTOMER project (userapp-1ac3c). */
export function getCustomerFirebaseAdmin() {
  return initApp("customer", loadCustomerCredentials, "customer");
}

/**
 * Legacy default — returns the DELIVERY app.
 * All existing call-sites (RiderNotificationService, etc.) keep working unchanged.
 */
export function getFirebaseAdmin() {
  return getDeliveryFirebaseAdmin();
}

/** FCM Messaging for the DELIVERY project. */
export function getFirebaseMessaging() {
  const app = getDeliveryFirebaseAdmin();
  return app ? getMessaging(app) : null;
}

/** FCM Messaging for the CUSTOMER project. */
export function getCustomerFirebaseMessaging() {
  const app = getCustomerFirebaseAdmin();
  return app ? getMessaging(app) : null;
}

export function isFirebaseAdminConfigured() {
  try { return Boolean(loadDeliveryCredentials()); } catch { return false; }
}

export default getFirebaseAdmin;
