import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "bulkserviceAccount.json");

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

/**
 * Resolves Firebase credentials in priority order:
 * 1. FIREBASE_SERVICE_ACCOUNT_JSON
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH
 * 3. backend/config/bulkserviceAccount.json (when neither env var is set)
 *
 * @returns {{ serviceAccount: object, source: string } | null}
 */
function loadServiceAccount() {
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
    source: `default config/bulkserviceAccount.json (${DEFAULT_SERVICE_ACCOUNT_PATH})`,
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

    // Credentials may have been added after a failed boot — retry once.
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
        "Firebase Admin: credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON, " +
          "FIREBASE_SERVICE_ACCOUNT_PATH, or place bulkserviceAccount.json at " +
          `${DEFAULT_SERVICE_ACCOUNT_PATH}.`
      );
      return null;
    }

    console.log(
      `Firebase Admin: loaded credentials from ${credentials.source}.`
    );

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
