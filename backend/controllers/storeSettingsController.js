import StoreSettings from "../models/StoreSettings.js";
import { normalizeEnviaOriginFields } from "../../shared/shipping/enviaOriginAddress.js";
import {
  clearStoreSettingsCache,
  getStoreSettings,
  normalizeMerchantUpiAccounts,
  normalizeShippingSlabs,
  serializeStoreSettings,
} from "../utils/storeSettingsHelpers.js";
import { normalizeGiftHamperTiers } from "../../shared/store/giftHamper.js";

const sanitizeNoticeLines = (lines) =>
  Array.isArray(lines)
    ? lines.map((line) => String(line || "").trim()).filter(Boolean)
    : undefined;

const sanitizeText = (value) => {
  if (value === undefined) return undefined;
  return String(value || "").trim();
};

const isValidUpiId = (value) => /^[\w.-]+@[\w.-]+$/.test(String(value || "").trim());

const sanitizeMerchantUpiAccounts = (accounts, defaultPayeeName = "BulkMobileMart") => {
  if (!Array.isArray(accounts)) return undefined;

  const normalized = accounts
    .map((account) => ({
      upiId: sanitizeText(account?.upiId) || "",
      label: sanitizeText(account?.label) || defaultPayeeName,
      enabled: account?.enabled !== false,
    }))
    .filter((account) => account.upiId);

  for (const account of normalized) {
    if (!isValidUpiId(account.upiId)) {
      return {
        error: `Enter a valid UPI ID (example: merchant@upi). Invalid: ${account.upiId}`,
      };
    }
  }

  let activeAssigned = false;
  const singleActiveAccounts = normalized.map((account) => {
    if (account.enabled && !activeAssigned) {
      activeAssigned = true;
      return account;
    }
    return { ...account, enabled: false };
  });

  return { accounts: singleActiveAccounts };
};

const toPositiveNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const sanitizeEnviaConfig = (envia = {}, existingEnvia = null) => {
  if (!envia || typeof envia !== "object") {
    return { error: "Invalid Envia settings payload" };
  }

  const origin = envia.origin || {};
  const packageDefaults =
    envia.packageDefaults !== undefined ? envia.packageDefaults || {} : existingEnvia?.packageDefaults || {};
  const submittedToken = sanitizeText(envia.apiToken) || "";
  const existingToken = sanitizeText(existingEnvia?.apiToken) || "";
  const apiToken = submittedToken || existingToken;

  const cleaned = {
    enabled: Boolean(envia.enabled),
    useSandbox: envia.useSandbox !== false,
    apiToken,
    defaultCarrier: sanitizeText(envia.defaultCarrier) || "",
    defaultService: sanitizeText(envia.defaultService) || "",
    rateCarriers: Array.isArray(envia.rateCarriers)
      ? envia.rateCarriers.map((entry) => sanitizeText(entry)).filter(Boolean)
      : [],
    origin: normalizeEnviaOriginFields(origin),
    packageDefaults: {
      type: sanitizeText(packageDefaults.type) || sanitizeText(existingEnvia?.packageDefaults?.type) || "box",
      content: sanitizeText(packageDefaults.content) || sanitizeText(existingEnvia?.packageDefaults?.content) || "Mobile accessories",
      amount: Math.max(
        1,
        Math.round(
          toPositiveNumber(
            packageDefaults.amount,
            toPositiveNumber(existingEnvia?.packageDefaults?.amount, 1)
          )
        )
      ),
      weightUnit: (
        sanitizeText(packageDefaults.weightUnit) ||
        sanitizeText(existingEnvia?.packageDefaults?.weightUnit) ||
        "KG"
      ).toUpperCase(),
      lengthUnit: (
        sanitizeText(packageDefaults.lengthUnit) ||
        sanitizeText(existingEnvia?.packageDefaults?.lengthUnit) ||
        "CM"
      ).toUpperCase(),
      weight: toPositiveNumber(
        packageDefaults.weight,
        toPositiveNumber(existingEnvia?.packageDefaults?.weight, 1)
      ),
      length: toPositiveNumber(
        packageDefaults.length,
        toPositiveNumber(existingEnvia?.packageDefaults?.length, 20)
      ),
      width: toPositiveNumber(
        packageDefaults.width,
        toPositiveNumber(existingEnvia?.packageDefaults?.width, 15)
      ),
      height: toPositiveNumber(
        packageDefaults.height,
        toPositiveNumber(existingEnvia?.packageDefaults?.height, 10)
      ),
    },
  };

  if (cleaned.enabled && !cleaned.apiToken) {
    return { error: "Envia API token is required when Envia is enabled" };
  }

  return { envia: cleaned };
};

export const getPublicStoreSettings = async (_req, res) => {
  try {
    const settings = await getStoreSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminStoreSettings = async (_req, res) => {
  try {
    const doc = await StoreSettings.findOne({ key: "store" });
    const settings = serializeStoreSettings(doc, { admin: true });
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStoreSettings = async (req, res) => {
  try {
    const {
      minimumOrderValue,
      minimumShippingCharge,
      shippingSlabs,
      merchantUpiId,
      merchantUpiName,
      merchantUpiAccounts,
      giftHamperTiers,
      giftHampersEnabled,
      cartNoticeEn,
      cartNoticeHi,
      envia,
    } = req.body;

    const payload = {};

    if (minimumOrderValue !== undefined) {
      const value = Number(minimumOrderValue);
      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum order value must be a valid number",
        });
      }
      payload.minimumOrderValue = value;
    }

    if (minimumShippingCharge !== undefined) {
      const value = Number(minimumShippingCharge);
      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum shipping charge must be a valid number",
        });
      }
      payload.minimumShippingCharge = value;
    }

    if (shippingSlabs !== undefined) {
      const normalized = normalizeShippingSlabs(shippingSlabs);
      if (!normalized.length) {
        return res.status(400).json({
          success: false,
          message: "Add at least one shipping slab",
        });
      }
      payload.shippingSlabs = normalized;
    }

    if (giftHamperTiers !== undefined) {
      payload.giftHamperTiers = normalizeGiftHamperTiers(giftHamperTiers);
    }

    if (giftHampersEnabled !== undefined) {
      payload.giftHampersEnabled = Boolean(giftHampersEnabled);
    }

    const defaultPayeeName = sanitizeText(merchantUpiName) || "BulkMobileMart";

    if (merchantUpiAccounts !== undefined) {
      const result = sanitizeMerchantUpiAccounts(merchantUpiAccounts, defaultPayeeName);
      if (result?.error) {
        return res.status(400).json({ success: false, message: result.error });
      }

      payload.merchantUpiAccounts = result.accounts;
      const primary = result.accounts.find((account) => account.enabled) || result.accounts[0];
      payload.merchantUpiId = primary?.upiId || "";
      payload.merchantUpiName = primary?.label || defaultPayeeName;
    } else if (merchantUpiId !== undefined || merchantUpiName !== undefined) {
      const upiId = sanitizeText(merchantUpiId) || "";
      if (upiId && !isValidUpiId(upiId)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid UPI ID (example: merchant@upi)",
        });
      }

      payload.merchantUpiId = upiId;
      payload.merchantUpiName = defaultPayeeName;
      payload.merchantUpiAccounts = upiId
        ? [{ upiId, label: defaultPayeeName, enabled: true }]
        : [];
    }

    if (merchantUpiName !== undefined && merchantUpiAccounts === undefined) {
      payload.merchantUpiName = defaultPayeeName;
    }

    const noticeEn = sanitizeNoticeLines(cartNoticeEn);
    if (noticeEn) payload.cartNoticeEn = noticeEn;

    const noticeHi = sanitizeNoticeLines(cartNoticeHi);
    if (noticeHi) payload.cartNoticeHi = noticeHi;

    let doc = await StoreSettings.findOne({ key: "store" });

    if (envia !== undefined) {
      const result = sanitizeEnviaConfig(envia, doc?.envia);
      if (result?.error) {
        return res.status(400).json({ success: false, message: result.error });
      }
      payload.envia = result.envia;
    }

    if (!doc) {
      doc = await StoreSettings.create({ key: "store", ...payload });
    } else {
      const { envia: enviaPayload, ...rest } = payload;
      Object.assign(doc, rest);
      if (enviaPayload !== undefined) {
        doc.set("envia", enviaPayload);
        doc.markModified("envia");
      }
      await doc.save();
    }

    clearStoreSettingsCache();
    const settings = serializeStoreSettings(doc, { admin: true });

    res.status(200).json({
      success: true,
      message: "Store settings updated",
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
