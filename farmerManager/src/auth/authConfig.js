/**
 * Farmer authentication strategy.
 *
 * DIRECT: mobile is a normal form field and the account is created immediately.
 * OTP can be enabled later by switching this to "OTP" and inserting send/verify
 * steps in front of createFarmerAccount() — registration payload and KYC flow stay the same.
 */
export const FARMER_AUTH_STRATEGY = "DIRECT";

export const REGISTRATION_FLOW = [
  "FORM",
  "VALIDATE",
  "CREATE_ACCOUNT",
  "SUCCESS",
  "KYC",
];
