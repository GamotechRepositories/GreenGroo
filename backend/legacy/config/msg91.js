const PLACEHOLDER_PATTERN = /^(your|xxx|test)/i;

const authKey = process.env.MSG91_AUTH_KEY?.trim() || "";
const templateId = process.env.MSG91_TEMPLATE_ID?.trim() || "";
const senderId = process.env.MSG91_SENDER_ID?.trim() || "";
const entityId = process.env.MSG91_ENTITY_ID?.trim() || "";

export const msg91Config = {
  authKey,
  templateId,
  senderId,
  entityId,
  otpLength: 6,
  otpExpiryMinutes: 10,
};

export function isMsg91Configured() {
  if (!authKey || !templateId) return false;
  if (PLACEHOLDER_PATTERN.test(authKey)) return false;
  if (PLACEHOLDER_PATTERN.test(templateId)) return false;
  return true;
}

export function assertMsg91Configured() {
  if (!isMsg91Configured()) {
    throw new Error(
      "MSG91 SMS is not configured. Add MSG91_AUTH_KEY and MSG91_TEMPLATE_ID to backend/.env"
    );
  }
}
