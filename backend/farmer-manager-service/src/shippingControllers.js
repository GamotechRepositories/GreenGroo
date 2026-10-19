import { VendorShippingMethod, Vendor } from "./models.js";

function vendorIdOf(req) {
  return req.user?.vendorId || req.user?.id || req.query?.vendorId || "global";
}

const DEFAULT_SHIPPING_CONFIG = {
  isActive: true,
  quantityRules: {
    enabled: true,
    baseCost: 30,
    freeAboveQuantity: 15,
    perExtraItemFee: 5,
    slabs: [
      { minQty: 1, maxQty: 5, cost: 30 },
      { minQty: 6, maxQty: 10, cost: 50 },
      { minQty: 11, maxQty: 20, cost: 80 },
    ],
  },
  userRules: {
    enabled: true,
    defaultCost: 40,
    userTypes: [
      { userType: "retail", label: "Retail Customer", cost: 40, freeAboveOrderAmount: 499 },
      { userType: "b2b", label: "B2B / Wholesale Buyer", cost: 100, freeAboveOrderAmount: 2999 },
      { userType: "vip", label: "VIP / Prime Member", cost: 0, freeAboveOrderAmount: 0 },
      { userType: "first_order", label: "First-Time Buyer", cost: 0, freeAboveOrderAmount: 199 },
    ],
  },
  pincodeRules: {
    enabled: true,
    defaultCost: 50,
    pincodes: [
      { code: "411057", areaName: "Hinjawadi (Local Zone 1)", cost: 25, isServiceable: true },
      { code: "411045", areaName: "Baner (Local Zone 2)", cost: 35, isServiceable: true },
      { code: "411001", areaName: "Pune City Central", cost: 60, isServiceable: true },
    ],
  },
  categoryRules: {
    enabled: true,
    defaultCost: 30,
    categories: [
      { categoryName: "Fresh Vegetables", extraCost: 10, isFreeShipping: false },
      { categoryName: "Fresh Fruits", extraCost: 15, isFreeShipping: false },
      { categoryName: "Dairy & Cold Chain", extraCost: 25, isFreeShipping: false },
      { categoryName: "Heavy Grains & Pulses", extraCost: 40, isFreeShipping: false },
    ],
  },
  weightRules: {
    enabled: true,
    baseWeightKg: 1,
    baseCost: 30,
    costPerExtraKg: 15,
    slabs: [
      { minWeightKg: 0, maxWeightKg: 2, cost: 30 },
      { minWeightKg: 2, maxWeightKg: 5, cost: 60 },
      { minWeightKg: 5, maxWeightKg: 10, cost: 110 },
      { minWeightKg: 10, maxWeightKg: 25, cost: 200 },
    ],
  },
  stateRules: {
    enabled: true,
    defaultCost: 90,
    states: [
      { stateName: "Maharashtra", cost: 40, isServiceable: true },
      { stateName: "Gujarat", cost: 80, isServiceable: true },
      { stateName: "Karnataka", cost: 90, isServiceable: true },
      { stateName: "Madhya Pradesh", cost: 110, isServiceable: true },
      { stateName: "Goa", cost: 70, isServiceable: true },
    ],
  },
};

/**
 * Get shipping methods configuration for the logged-in vendor or requested vendorId
 */
export async function getVendorShippingMethods(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    let config = await VendorShippingMethod.findOne({ vendorId }).lean();
    if (!config) {
      // Return defaults if not yet customized
      config = { ...DEFAULT_SHIPPING_CONFIG, vendorId };
    }
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load shipping methods" });
  }
}

/**
 * Save shipping methods configuration for the vendor
 */
export async function saveVendorShippingMethods(req, res) {
  try {
    const vendorId = vendorIdOf(req);
    const body = req.body || {};

    const updated = await VendorShippingMethod.findOneAndUpdate(
      { vendorId },
      {
        $set: {
          vendorId,
          isActive: body.isActive !== false,
          quantityRules: body.quantityRules || DEFAULT_SHIPPING_CONFIG.quantityRules,
          userRules: body.userRules || DEFAULT_SHIPPING_CONFIG.userRules,
          pincodeRules: body.pincodeRules || DEFAULT_SHIPPING_CONFIG.pincodeRules,
          categoryRules: body.categoryRules || DEFAULT_SHIPPING_CONFIG.categoryRules,
          weightRules: body.weightRules || DEFAULT_SHIPPING_CONFIG.weightRules,
          stateRules: body.stateRules || DEFAULT_SHIPPING_CONFIG.stateRules,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Shipping methods updated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to save shipping methods" });
  }
}

/**
 * Admin view of shipping methods (supports querying specific vendor or global default)
 */
export async function getAdminShippingMethods(req, res) {
  try {
    const vendorId = req.query.vendorId || "global";
    let [config, vendors] = await Promise.all([
      VendorShippingMethod.findOne({ vendorId }).lean(),
      Vendor.find().select("id vendorName ownerName city state").sort({ vendorName: 1 }).lean(),
    ]);

    if (!config) {
      config = { ...DEFAULT_SHIPPING_CONFIG, vendorId };
    }

    res.json({
      success: true,
      data: config,
      vendors: vendors.map((v) => ({
        id: v.id,
        name: v.vendorName || v.ownerName || v.id,
        location: [v.city, v.state].filter(Boolean).join(", "),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load shipping methods" });
  }
}

/**
 * Admin update of shipping methods (supports saving to a specific vendor or global default)
 */
export async function saveAdminShippingMethods(req, res) {
  try {
    const vendorId = req.query.vendorId || req.body?.vendorId || "global";
    const body = req.body || {};

    const updated = await VendorShippingMethod.findOneAndUpdate(
      { vendorId },
      {
        $set: {
          vendorId,
          isActive: body.isActive !== false,
          quantityRules: body.quantityRules || DEFAULT_SHIPPING_CONFIG.quantityRules,
          userRules: body.userRules || DEFAULT_SHIPPING_CONFIG.userRules,
          pincodeRules: body.pincodeRules || DEFAULT_SHIPPING_CONFIG.pincodeRules,
          categoryRules: body.categoryRules || DEFAULT_SHIPPING_CONFIG.categoryRules,
          weightRules: body.weightRules || DEFAULT_SHIPPING_CONFIG.weightRules,
          stateRules: body.stateRules || DEFAULT_SHIPPING_CONFIG.stateRules,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Shipping methods updated successfully by admin",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to save shipping methods" });
  }
}

/**
 * Calculate shipping fee given cart / order parameters
 */
export async function calculateShippingRate(req, res) {
  try {
    const {
      vendorId = "global",
      quantity = 1,
      orderAmount = 0,
      userType = "retail",
      pincode = "",
      categories = [],
      weightKg = 1,
      state = "Maharashtra",
    } = req.body || {};

    let config = await VendorShippingMethod.findOne({ vendorId }).lean();
    if (!config && vendorId !== "global") {
      config = await VendorShippingMethod.findOne({ vendorId: "global" }).lean();
    }
    if (!config) config = DEFAULT_SHIPPING_CONFIG;

    const breakdown = {};
    let totalShippingCost = 0;

    // 1. Quantity cost
    if (config.quantityRules?.enabled) {
      const q = Math.max(1, Number(quantity) || 1);
      const freeAt = Number(config.quantityRules.freeAboveQuantity) || 0;
      if (freeAt > 0 && q >= freeAt) {
        breakdown.quantity = { cost: 0, reason: `Free shipping (Quantity >= ${freeAt})` };
      } else {
        const slabs = config.quantityRules.slabs || [];
        const match = slabs.find((s) => q >= s.minQty && q <= s.maxQty);
        let qCost = match ? Number(match.cost) : Number(config.quantityRules.baseCost || 0);
        const maxSlab = slabs.length > 0 ? slabs[slabs.length - 1] : null;
        if (maxSlab && q > maxSlab.maxQty) {
          const extra = (q - maxSlab.maxQty) * (Number(config.quantityRules.perExtraItemFee) || 0);
          qCost = Number(maxSlab.cost) + extra;
        }
        breakdown.quantity = { cost: qCost, reason: `Quantity slab for ${q} items` };
      }
    }

    // 2. User type cost
    if (config.userRules?.enabled) {
      const uTypes = config.userRules.userTypes || [];
      const match = uTypes.find((u) => u.userType === userType);
      const userCost = match ? Number(match.cost) : Number(config.userRules.defaultCost || 40);
      const freeAt = match ? Number(match.freeAboveOrderAmount || 0) : 0;
      if (freeAt > 0 && Number(orderAmount) >= freeAt) {
        breakdown.user = { cost: 0, reason: `Free for ${match?.label || userType} above ₹${freeAt}` };
      } else {
        breakdown.user = { cost: userCost, reason: `Rate for ${match?.label || userType}` };
      }
    }

    // 3. Pincode cost
    if (config.pincodeRules?.enabled) {
      const pins = config.pincodeRules.pincodes || [];
      const match = pins.find((p) => String(p.code).trim() === String(pincode).trim());
      if (match) {
        breakdown.pincode = {
          cost: Number(match.cost),
          isServiceable: match.isServiceable !== false,
          reason: `${match.areaName || pincode} delivery zone`,
        };
      } else {
        breakdown.pincode = {
          cost: Number(config.pincodeRules.defaultCost || 50),
          isServiceable: true,
          reason: `Standard delivery for pincode ${pincode || "general"}`,
        };
      }
    }

    // 4. Category extra cost
    if (config.categoryRules?.enabled && Array.isArray(categories) && categories.length > 0) {
      const catRules = config.categoryRules.categories || [];
      let extra = 0;
      const matchedCats = [];
      for (const c of categories) {
        const found = catRules.find((r) => r.categoryName?.toLowerCase() === String(c).toLowerCase());
        if (found && !found.isFreeShipping) {
          extra += Number(found.extraCost || 0);
          matchedCats.push(`${found.categoryName} (+₹${found.extraCost})`);
        }
      }
      breakdown.category = { cost: extra, reason: matchedCats.length ? matchedCats.join(", ") : "Standard category rate" };
    }

    // 5. Weight cost
    if (config.weightRules?.enabled) {
      const w = Math.max(0, Number(weightKg) || 1);
      const slabs = config.weightRules.slabs || [];
      const match = slabs.find((s) => w >= s.minWeightKg && w <= s.maxWeightKg);
      let wCost = match ? Number(match.cost) : Number(config.weightRules.baseCost || 30);
      const maxSlab = slabs.length > 0 ? slabs[slabs.length - 1] : null;
      if (maxSlab && w > maxSlab.maxWeightKg) {
        const extraKg = Math.ceil(w - maxSlab.maxWeightKg);
        wCost = Number(maxSlab.cost) + extraKg * (Number(config.weightRules.costPerExtraKg) || 15);
      }
      breakdown.weight = { cost: wCost, reason: `Weight tier for ${w.toFixed(1)} kg` };
    }

    // 6. State cost
    if (config.stateRules?.enabled) {
      const states = config.stateRules.states || [];
      const match = states.find((s) => s.stateName?.toLowerCase() === String(state).toLowerCase());
      if (match) {
        breakdown.state = { cost: Number(match.cost), reason: `State delivery rate for ${match.stateName}` };
      } else {
        breakdown.state = { cost: Number(config.stateRules.defaultCost || 90), reason: `Standard interstate rate for ${state}` };
      }
    }

    // Determine final shipping: Max base rate (weight / state / pincode / quantity) + user discount or category surcharges
    const baseRates = [
      breakdown.weight?.cost ?? 0,
      breakdown.state?.cost ?? 0,
      breakdown.pincode?.cost ?? 0,
      breakdown.quantity?.cost ?? 0,
    ];
    const highestBase = Math.max(...baseRates);
    const categorySurcharge = breakdown.category?.cost ?? 0;
    const userTierDiscountOrFee = breakdown.user?.cost != null ? breakdown.user.cost : highestBase;

    // Final shipping calculation:
    totalShippingCost = Math.max(highestBase, userTierDiscountOrFee) + categorySurcharge;
    if (breakdown.user?.cost === 0 || breakdown.quantity?.cost === 0) {
      totalShippingCost = 0; // Free delivery rule triggered
    }

    res.json({
      success: true,
      shippingCost: Math.round(totalShippingCost),
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to calculate shipping rate" });
  }
}
