import crypto from "crypto";
import { nextSequence } from "../erp-service/src/services/idGenerator.js";

export function randomIdSuffix(bytes = 3) {
  return crypto.randomBytes(bytes).toString("hex");
}

/** `prefix-<ms>-<hex>`: safe when two records are created in the same millisecond. */
export function timestampId(prefix) {
  return `${prefix}-${Date.now()}-${randomIdSuffix()}`;
}

/**
 * Human-readable sequential ID backed by the atomic ERP counter, e.g.
 * serialId("ADJ", { scope: "2026", width: 6 }) → "ADJ-2026-000001".
 */
export async function serialId(prefix, { scope = "", width = 5 } = {}) {
  const seq = await nextSequence(`serial-${prefix}${scope ? `-${scope}` : ""}`);
  return `${prefix}-${scope ? `${scope}-` : ""}${String(seq).padStart(width, "0")}`;
}
