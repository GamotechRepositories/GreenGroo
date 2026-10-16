const PLACEHOLDER_PATTERN = /^(your|xxx|test)/i;

/**
 * 8 Approved MSG91 DLT Template IDs & Sender GREGRC
 */
export const MSG91_TEMPLATES = {
  // 1. Delivery verification OTP for userapp / frontend / delivery completion
  DELIVERY_VERIFICATION:
    process.env.MSG91_TEMPLATE_DELIVERY_VERIFY?.trim() || "1277179206470002377",

  // 2. GreenGrocc Admin Login OTP
  ADMIN_LOGIN:
    process.env.MSG91_TEMPLATE_ADMIN_LOGIN?.trim() || "1277179206046350946",

  // 3. GreenGrocc Customer Login OTP for userapp / frontend
  USER_LOGIN:
    process.env.MSG91_TEMPLATE_USER_LOGIN?.trim() || "1277179206610483262",

  // 4. GreenGrocc Customer Registration OTP for userapp / frontend
  USER_REGISTRATION:
    process.env.MSG91_TEMPLATE_USER_REG?.trim() || "1277179206667336427",

  // 5. Delivery Partner Login OTP for delivery app
  DELIVERY_PARTNER_LOGIN:
    process.env.MSG91_TEMPLATE_DELIVERY_LOGIN?.trim() || "1277179206817944860",

  // 6. Delivery Partner Registration OTP for delivery app
  DELIVERY_PARTNER_REGISTRATION:
    process.env.MSG91_TEMPLATE_DELIVERY_REG?.trim() || "1277179206647085826",

  // 7. Haritsetu Registration OTP for farmer app
  HARITSETU_REGISTRATION:
    process.env.MSG91_TEMPLATE_FARMER_REG?.trim() || "1277179206800949621",

  // 8. Haritsetu Login OTP for farmer app
  HARITSETU_LOGIN:
    process.env.MSG91_TEMPLATE_FARMER_LOGIN?.trim() || "1277179206725138232",
};

export const msg91Config = {
  get authKey() {
    return process.env.MSG91_AUTH_KEY?.trim() || "";
  },
  get senderId() {
    return process.env.MSG91_SENDER_ID?.trim() || "GREGRC";
  },
  get entityId() {
    return process.env.MSG91_ENTITY_ID?.trim() || "";
  },
  get templateId() {
    return process.env.MSG91_TEMPLATE_ID?.trim() || MSG91_TEMPLATES.USER_LOGIN;
  },
  templates: MSG91_TEMPLATES,
  otpLength: 6,
  otpExpiryMinutes: 10,
};

export function isMsg91Configured() {
  const authKey = msg91Config.authKey;
  if (!authKey) return false;
  if (PLACEHOLDER_PATTERN.test(authKey)) return false;
  return true;
}

export function assertMsg91Configured() {
  if (!isMsg91Configured()) {
    throw new Error(
      "MSG91 SMS is not configured. Add MSG91_AUTH_KEY to backend/.env"
    );
  }
}

