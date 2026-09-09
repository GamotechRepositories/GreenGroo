import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVICE_ACCOUNT_PATH = path.resolve(
  __dirname,
  "bulkserviceAccount.json"
);

let adminApp = null;
let initAttempted = false;
let initError = null;

function parseServiceAccount(raw, source) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const parseError = new Error(
      `Firebase Admin: invalid JSON in ${source} — ${error.message}`
    );
    parseError.cause = error;
    throw parseError;
  }
}

function resolveConfiguredPath(configuredPath) {
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

function readServiceAccountFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return parseServiceAccount(raw, filePath);
}

function env(name) {
  return process.env[name]?.trim() || "";
}

/**
 * Preferred secure mode: each service-account field as its own env var.
 * FIREBASE_PRIVATE_KEY may use literal \n for newlines.
 */
function loadServiceAccountFromEnvVars() {
  const projectId = env("FIREBASE_PROJECT_ID");
  const clientEmail = env("FIREBASE_CLIENT_EMAIL");
  let privateKey = env("FIREBASE_PRIVATE_KEY");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  // dotenv keeps "\n" as two chars — convert to real newlines for PEM
  privateKey = privateKey.replace(/\\n/g, "\n");

  return {
    serviceAccount: {
      type: env("FIREBASE_TYPE") || "service_account",
      project_id: projectId,
      private_key_id: env("FIREBASE_PRIVATE_KEY_ID"),
      private_key: privateKey,
      client_email: clientEmail,
      client_id: env("FIREBASE_CLIENT_ID"),
      auth_uri:
        env("FIREBASE_AUTH_URI") || "https://accounts.google.com/o/oauth2/auth",
      token_uri:
        env("FIREBASE_TOKEN_URI") || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url:
        env("FIREBASE_AUTH_PROVIDER_X509_CERT_URL") ||
        "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: env("FIREBASE_CLIENT_X509_CERT_URL"),
      universe_domain: env("FIREBASE_UNIVERSE_DOMAIN") || "googleapis.com",
    },
    source: "FIREBASE_* individual env vars",
  };
}

/**
 * Resolves Firebase credentials in priority order:
 * 1. Individual FIREBASE_* env vars (most secure / recommended)
 * 2. FIREBASE_SERVICE_ACCOUNT_JSON (single-line JSON only)
 * 3. FIREBASE_SERVICE_ACCOUNT_PATH
 * 4. default legacy/config/bulkserviceAccount.json
 *
 * @returns {{ serviceAccount: object, source: string } | null}
 */
function loadServiceAccount() {
  const fromVars = loadServiceAccountFromEnvVars();
  if (fromVars) return fromVars;

  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    return {
      serviceAccount: parseServiceAccount(
        inlineJson,
        "FIREBASE_SERVICE_ACCOUNT_JSON"
      ),
      source: "FIREBASE_SERVICE_ACCOUNT_JSON",
    };
  }

  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (configuredPath) {
    const credentialsPath = resolveConfiguredPath(configuredPath);
    const serviceAccount = readServiceAccountFromFile(credentialsPath);
    if (!serviceAccount) {
      console.error(
        `Firebase Admin: FIREBASE_SERVICE_ACCOUNT_PATH file not found — ${credentialsPath}`
      );
      return null;
    }

    return {
      serviceAccount,
      source: `FIREBASE_SERVICE_ACCOUNT_PATH (${credentialsPath})`,
    };
  }

  const serviceAccount = readServiceAccountFromFile(DEFAULT_SERVICE_ACCOUNT_PATH);
  if (!serviceAccount) {
    return null;
  }

  return {
    serviceAccount,
    source: `default bulkserviceAccount.json (${DEFAULT_SERVICE_ACCOUNT_PATH})`,
  };
}

export function isFirebaseAdminConfigured() {
  try {
    return Boolean(loadServiceAccount());
  } catch {
    return false;
  }
}

export function getFirebaseAdmin() {
  if (adminApp) {
    return adminApp;
  }

  if (initAttempted) {
    if (initError) {
      throw initError;
    }

    if (loadServiceAccount()) {
      initAttempted = false;
    } else {
      return null;
    }
  }

  initAttempted = true;

  try {
    const credentials = loadServiceAccount();
    if (!credentials) {
      console.warn(
        "Firebase Admin: credentials not configured. Set individual FIREBASE_* env vars " +
          "(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, …), " +
          "or FIREBASE_SERVICE_ACCOUNT_PATH / bulkserviceAccount.json."
      );
      return null;
    }

    console.log(`Firebase Admin: loaded credentials from ${credentials.source}.`);

    adminApp = admin.initializeApp({
      credential: admin.cert(credentials.serviceAccount),
    });

    console.log("Firebase Admin initialized successfully.");
    return adminApp;
  } catch (error) {
    initError = error;
    console.error("Firebase Admin initialization failed:", error.message);
    throw error;
  }
}

export function getFirebaseMessaging() {
  const app = getFirebaseAdmin();
  if (!app) {
    return null;
  }

  return getMessaging(app);
}

export default getFirebaseAdmin;
