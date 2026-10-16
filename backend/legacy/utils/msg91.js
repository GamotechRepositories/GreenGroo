import {
  assertMsg91Configured,
  isMsg91Configured,
  msg91Config,
  MSG91_TEMPLATES,
} from "../config/msg91.js";

const VERIFIED_PHONE_TTL_MS = 10 * 60 * 1000;
const verifiedPhoneStore = new Map();
const devMockOtpStore = new Map();

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

/**
 * Maps friendly aliases or DLT template names to approved 19-digit MSG91 template IDs.
 */
export function resolveTemplateId(templateOrPurpose, role) {
  if (!templateOrPurpose && !role) return msg91Config.templateId;

  const key = String(templateOrPurpose || "").trim().toLowerCase();
  const roleKey = String(role || "").trim().toLowerCase();

  // If already a valid template ID (digits), return directly
  if (/^\d{10,24}$/.test(String(templateOrPurpose).trim())) {
    return String(templateOrPurpose).trim();
  }

  // Role-scoped resolution
  if (roleKey === "farmer" || roleKey === "haritsetu") {
    if (key === "register" || key === "signup" || key === "registration") {
      return MSG91_TEMPLATES.HARITSETU_REGISTRATION;
    }
    return MSG91_TEMPLATES.HARITSETU_LOGIN;
  }

  if (roleKey === "delivery" || roleKey === "delivery_partner" || roleKey === "rider" || roleKey === "driver") {
    if (key === "register" || key === "signup" || key === "registration") {
      return MSG91_TEMPLATES.DELIVERY_PARTNER_REGISTRATION;
    }
    return MSG91_TEMPLATES.DELIVERY_PARTNER_LOGIN;
  }

  if (roleKey === "admin") {
    return MSG91_TEMPLATES.ADMIN_LOGIN;
  }

  if (roleKey === "user" || roleKey === "customer" || roleKey === "frontend") {
    if (key === "register" || key === "signup" || key === "registration") {
      return MSG91_TEMPLATES.USER_REGISTRATION;
    }
    return MSG91_TEMPLATES.USER_LOGIN;
  }

  // 1. Delivery verification OTP (customer delivery handover)
  if (
    key === "delivery_verification_otp" ||
    key === "delivery_verification" ||
    key === "delivery_verify" ||
    key === "delivery_otp" ||
    key === "order_delivery"
  ) {
    return MSG91_TEMPLATES.DELIVERY_VERIFICATION;
  }

  // 2. GreenGrocc Admin Login OTP
  if (
    key === "greengrocc admin login otp" ||
    key === "admin_login_otp" ||
    key === "admin_login" ||
    key === "admin" ||
    key === "admin_security" ||
    key === "admin_reset"
  ) {
    return MSG91_TEMPLATES.ADMIN_LOGIN;
  }

  // 3. GreenGrocc Customer Login OTP
  if (
    key === "greengrocc_login_otp" ||
    key === "user_login" ||
    key === "login" ||
    key === "customer_login"
  ) {
    return MSG91_TEMPLATES.USER_LOGIN;
  }

  // 4. GreenGrocc Customer Registration OTP
  if (
    key === "greengrocc_registration_otp" ||
    key === "user_registration" ||
    key === "user_reg" ||
    key === "signup" ||
    key === "register" ||
    key === "registration" ||
    key === "customer_reg"
  ) {
    return MSG91_TEMPLATES.USER_REGISTRATION;
  }

  // 5. Delivery Partner Login OTP
  if (
    key === "delivery_partner_login_otp" ||
    key === "delivery_partner_login" ||
    key === "delivery_login" ||
    key === "rider_login" ||
    key === "driver_login"
  ) {
    return MSG91_TEMPLATES.DELIVERY_PARTNER_LOGIN;
  }

  // 6. Delivery Partner Registration OTP
  if (
    key === "delivery_partner_reg_otp" ||
    key === "delivery_partner_registration" ||
    key === "delivery_partner_reg" ||
    key === "delivery_reg" ||
    key === "rider_reg" ||
    key === "driver_reg"
  ) {
    return MSG91_TEMPLATES.DELIVERY_PARTNER_REGISTRATION;
  }

  // 7. Haritsetu Registration OTP (Farmer App)
  if (
    key === "haritsetu_registration_otp" ||
    key === "haritsetu_registration" ||
    key === "haritsetu_reg" ||
    key === "farmer_registration" ||
    key === "farmer_reg"
  ) {
    return MSG91_TEMPLATES.HARITSETU_REGISTRATION;
  }

  // 8. Haritsetu Login OTP (Farmer App)
  if (
    key === "haritsetu_login_otp" ||
    key === "haritsetu_login" ||
    key === "farmer_login"
  ) {
    return MSG91_TEMPLATES.HARITSETU_LOGIN;
  }

  return msg91Config.templateId;
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

/**
 * Universal OTP dispatching helper supporting all 8 templates.
 */
export async function sendOtp({
  phone,
  purpose = "login",
  templateId,
  role,
  otp,
  otpLength,
  otpExpiryMinutes,
}) {
  const phone10 = normalizeIndianPhone(phone);
  if (!phone10) {
    throw new Error("Valid 10-digit Indian phone number required");
  }

  const finalTemplateId = templateId
    ? resolveTemplateId(templateId)
    : resolveTemplateId(purpose, role);
  const length = Number(otpLength || msg91Config.otpLength || 6);
  const expiry = Number(otpExpiryMinutes || msg91Config.otpExpiryMinutes || 10);
  const sender = msg91Config.senderId || "GREGRC";

  if (!isMsg91Configured()) {
    // In dev mode or when credentials are not yet entered, simulate sending and store OTP
    const mockCode = otp ? String(otp) : "123456";
    devMockOtpStore.set(phone10, {
      code: mockCode,
      purpose,
      expiresAt: Date.now() + expiry * 60 * 1000,
    });
    console.warn(
      `[MSG91 DEV MOCK] OTP for +91${phone10}: ${mockCode} | Template: ${finalTemplateId} | Sender: ${sender} (Configure MSG91_AUTH_KEY in .env for live SMS)`
    );
    return {
      success: true,
      message: "OTP sent successfully (dev mode)",
      devMock: true,
      templateId: finalTemplateId,
    };
  }

  const params = new URLSearchParams({
    template_id: finalTemplateId,
    mobile: toMsg91Mobile(phone10),
    otp_length: String(length),
    otp_expiry: String(expiry),
  });

  if (sender) {
    params.set("sender", sender);
  }

  if (msg91Config.entityId) {
    params.set("entity_id", msg91Config.entityId);
  }

  if (otp) {
    params.set("otp", String(otp).trim());
  }

  const response = await fetch(
    `https://control.msg91.com/api/v5/otp?${params.toString()}`,
    {
      method: "POST",
      headers: {
        authkey: msg91Config.authKey,
        "Content-Type": "application/json",
      },
      body: otp ? JSON.stringify({ otp: String(otp).trim() }) : undefined,
    }
  );

  const data = await parseMsg91Response(response);
  if (data.type === "error") {
    throw new Error(data.message || "Failed to send OTP");
  }

  return {
    success: true,
    message: data.message || "OTP sent successfully",
    templateId: finalTemplateId,
  };
}

/**
 * Universal OTP verification helper.
 */
export async function verifyOtp({ phone, otp, purpose }) {
  const phone10 = normalizeIndianPhone(phone);
  if (!phone10) {
    return { ok: false, message: "Valid 10-digit Indian phone number required" };
  }

  const cleanOtp = String(otp || "").trim();
  if (!cleanOtp || !/^\d{4,8}$/.test(cleanOtp)) {
    return { ok: false, message: "Please enter a valid OTP" };
  }

  // Check dev mock first if MSG91 is not configured
  if (!isMsg91Configured()) {
    const mock = devMockOtpStore.get(phone10);
    if (mock && mock.expiresAt > Date.now() && (mock.code === cleanOtp || cleanOtp === "123456")) {
      devMockOtpStore.delete(phone10);
      return { ok: true, devMock: true };
    }
    if (cleanOtp === "123456") {
      return { ok: true, devMock: true };
    }
    return { ok: false, message: "Invalid or expired OTP" };
  }

  try {
    const { authKey } = msg91Config;
    const params = new URLSearchParams({
      mobile: toMsg91Mobile(phone10),
      otp: cleanOtp,
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

// ----------------------------------------------------
// Specific Helper Wrappers for Apps & Roles
// ----------------------------------------------------

/** Customer / Userapp OTP Login */
export async function sendLoginOtp(phone10, purpose = "login") {
  return sendOtp({
    phone: phone10,
    purpose: purpose === "signup" || purpose === "register"
      ? MSG91_TEMPLATES.USER_REGISTRATION
      : MSG91_TEMPLATES.USER_LOGIN,
  });
}

export async function verifyLoginOtp(phone10, otp) {
  return verifyOtp({ phone: phone10, otp, purpose: "login" });
}

/** Admin Login / Security OTP */
export async function sendAdminLoginOtp(phone10) {
  return sendOtp({
    phone: phone10,
    templateId: MSG91_TEMPLATES.ADMIN_LOGIN,
    purpose: "admin_login",
  });
}

/** Customer Delivery Verification OTP */
export async function sendDeliveryVerificationOtp(phone10, otpCode) {
  return sendOtp({
    phone: phone10,
    templateId: MSG91_TEMPLATES.DELIVERY_VERIFICATION,
    purpose: "delivery_verification",
    otp: otpCode,
    otpLength: String(otpCode).length,
  });
}

/** Delivery Partner App (Login / Registration) */
export async function sendDeliveryPartnerOtp(phone10, purpose = "login") {
  const isReg = purpose === "register" || purpose === "signup";
  return sendOtp({
    phone: phone10,
    templateId: isReg
      ? MSG91_TEMPLATES.DELIVERY_PARTNER_REGISTRATION
      : MSG91_TEMPLATES.DELIVERY_PARTNER_LOGIN,
    purpose: isReg ? "delivery_partner_registration" : "delivery_partner_login",
  });
}

/** Farmer App / Haritsetu (Login / Registration) */
export async function sendFarmerOtp(phone10, purpose = "login") {
  const isReg = purpose === "register" || purpose === "signup";
  return sendOtp({
    phone: phone10,
    templateId: isReg
      ? MSG91_TEMPLATES.HARITSETU_REGISTRATION
      : MSG91_TEMPLATES.HARITSETU_LOGIN,
    purpose: isReg ? "haritsetu_registration" : "haritsetu_login",
  });
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

export { isMsg91Configured, assertMsg91Configured, MSG91_TEMPLATES, msg91Config };

