export { default as connectDB } from "./db/connect.js";
export {
  protect,
  requireAdmin,
  requireRoles,
  optionalAuth,
} from "./middleware/auth.js";
export { errorHandler, notFound } from "./middleware/errorHandler.js";
export { createServiceApp } from "./createServiceApp.js";
export { checkPhoneConflict, normalizeIndianPhone } from "./utils/phoneCheck.js";
export {
  sendOtp,
  retryOtp,
  resendOtp,
  verifyOtp,
  sendLoginOtp,
  resendLoginOtp,
  verifyLoginOtp,
  sendAdminLoginOtp,
  resendAdminLoginOtp,
  verifyAdminLoginOtp,
  sendDeliveryVerificationOtp,
  sendDeliveryPartnerOtp,
  resendDeliveryPartnerOtp,
  sendFarmerOtp,
  resendFarmerOtp,
  resolveTemplateId,
  isMsg91Configured,
  assertMsg91Configured,
  MSG91_TEMPLATES,
  msg91Config,
  markPhoneOtpVerified,
  consumeVerifiedPhone,
  isPhoneOtpVerified,
} from "../legacy/utils/msg91.js";
