import { assertMsg91Configured, isMsg91Configured, msg91Config } from "../config/msg91.js";

const VERIFIED_PHONE_TTL_MS = 10 * 60 * 1000;
const verifiedPhoneStore = new Map();

export function normalizeIndianPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10 && /^[6789]/.test(digits)) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return null;
}

export function toMsg91Mobile(phone10) {
  return `91${phone10}`;
}

async function parseMsg91Response(response) {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const message =
      data.message || data.type || `MSG91 request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function sendLoginOtp(phone10) {
  assertMsg91Configured();

  const { authKey, templateId, senderId, entityId, otpLength, otpExpiryMinutes } =
    msg91Config;

  const params = new URLSearchParams({
    template_id: templateId,
    mobile: toMsg91Mobile(phone10),
    otp_length: String(otpLength),
    otp_expiry: String(otpExpiryMinutes),
  });

  if (senderId) {
    params.set("sender", senderId);
  }

  if (entityId) {
    params.set("entity_id", entityId);
  }

  const response = await fetch(
    `https://control.msg91.com/api/v5/otp?${params.toString()}`,
    {
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await parseMsg91Response(response);
  if (data.type === "error") {
    throw new Error(data.message || "Failed to send OTP");
  }

  return { message: "OTP sent successfully" };
}

export async function verifyLoginOtp(phone10, otp) {
  if (!otp || !/^\d{4,8}$/.test(String(otp).trim())) {
    return { ok: false, message: "Please enter a valid OTP" };
  }

  try {
    assertMsg91Configured();

    const { authKey } = msg91Config;
    const params = new URLSearchParams({
      mobile: toMsg91Mobile(phone10),
      otp: String(otp).trim(),
    });

    const response = await fetch(
      `https://control.msg91.com/api/v5/otp/verify?${params.toString()}`,
      {
        method: "GET",
        headers: {
          authkey: authKey,
          accept: "application/json",
        },
      }
    );

    const data = await parseMsg91Response(response);
    if (data.type === "error") {
      return { ok: false, message: data.message || "Invalid OTP" };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message || "OTP verification failed" };
  }
}

export function markPhoneOtpVerified(phone10) {
  verifiedPhoneStore.set(phone10, Date.now() + VERIFIED_PHONE_TTL_MS);
}

export function consumeVerifiedPhone(phone10) {
  const expiresAt = verifiedPhoneStore.get(phone10);
  if (!expiresAt || Date.now() > expiresAt) {
    verifiedPhoneStore.delete(phone10);
    return false;
  }
  verifiedPhoneStore.delete(phone10);
  return true;
}

export function isPhoneOtpVerified(phone10) {
  const expiresAt = verifiedPhoneStore.get(phone10);
  if (!expiresAt || Date.now() > expiresAt) {
    verifiedPhoneStore.delete(phone10);
    return false;
  }
  return true;
}

export { isMsg91Configured };
