import { RESOURCES } from "../config/resources.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE = /^[6-9]\d{9}$/;
const GST = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

export function validateField(name, value) {
  if (value === undefined || value === null || value === "") return null;
  if (name === "email" && !EMAIL.test(value)) return "Invalid email";
  if ((name === "mobile" || name === "contactNumber") && String(value).replace(/\D/g, "").length === 10 && !MOBILE.test(String(value).replace(/\D/g, ""))) {
    return "Invalid mobile number";
  }
  if (name === "gstNumber" && value && !GST.test(String(value).replace(/\s/g, ""))) return "Invalid GST number";
  if (name === "panNumber" && value && !PAN.test(String(value).toUpperCase())) return "Invalid PAN number";
  if ((name === "quantity" || name === "weight" || name === "amount" || name.endsWith("Price") || name.endsWith("Stock")) && Number.isNaN(Number(value))) {
    return `${name} must be numeric`;
  }
  if ((name === "quantity" || name === "weight" || name.endsWith("Stock")) && Number(value) < 0) {
    return `${name} cannot be negative`;
  }
  return null;
}

export async function assertRefs(resourceKey, body) {
  const spec = RESOURCES[resourceKey];
  if (!spec?.refs) return;
  for (const [field, targetKey] of Object.entries(spec.refs)) {
    const id = body[field];
    if (!id) continue;
    const target = RESOURCES[targetKey];
    if (!target) continue;
    const found = await target.model.exists({ [target.idField]: id, isDeleted: { $ne: true } });
    if (!found) {
      throw new Error(`${spec.label} cannot reference missing ${target.label} (${id})`);
    }
  }
}

export function stripImmutable(body, idField) {
  const clone = { ...body };
  delete clone._id;
  delete clone[idField];
  delete clone.createdAt;
  delete clone.passwordHash;
  delete clone.password;
  return clone;
}

export function hideSensitive(doc) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  delete obj.passwordHash;
  delete obj.password;
  if (obj.bankDetails?.accountNumber) obj.bankDetails.accountNumber = undefined;
  return obj;
}
