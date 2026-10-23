import mongoose from "mongoose";
import { DynamicPricingRule } from "./models.js";

let cache = { at: 0, rules: [] };
const CACHE_MS = 30_000;

function ruleIsLive(rule, now = new Date()) {
  if (!rule?.enabled) return false;
  if (rule.startDate && now < new Date(rule.startDate)) return false;
  if (rule.endDate && now > new Date(rule.endDate)) return false;
  return true;
}

export async function getActivePricingRules() {
  const now = Date.now();
  if (now - cache.at < CACHE_MS && cache.rules.length) return cache.rules;
  try {
    const rules = await DynamicPricingRule.find({ enabled: true }).lean();
    cache = { at: now, rules: rules.filter((rule) => ruleIsLive(rule)) };
    return cache.rules;
  } catch (err) {
    console.warn("Failed to fetch dynamic pricing rules:", err.message);
    return cache.rules || [];
  }
}

export function invalidatePricingCache() {
  cache = { at: 0, rules: [] };
}

/**
 * Extracts normalized categories and IDs from a product document or raw item.
 */
function getProductCategoriesAndId(product) {
  const id = String(product?._id || product?.id || product?.productId || "");
  const categories = [
    ...(Array.isArray(product?.categories) ? product.categories : []),
    product?.category,
    product?.subcategory,
    ...(Array.isArray(product?.subcategories) ? product.subcategories : []),
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return { id, categories };
}

/**
 * Matches quantity-based rules for a single product (used for PDP badges and catalogue decoration).
 */
export function matchRulesForProduct(product, rules = []) {
  const { id, categories } = getProductCategoriesAndId(product);

  return rules
    .filter((rule) => {
      // Legacy rules without ruleType default to quantity_discount
      const type = rule.ruleType || "quantity_discount";
      if (type !== "quantity_discount" && type !== "tiered_quantity") return false;

      if (rule.applyTo === "all") return true;
      if (rule.applyTo === "products") {
        return (rule.productIds || []).some((pid) => String(pid) === id);
      }
      if (rule.applyTo === "categories") {
        const names = (rule.categoryNames || []).map((name) => String(name).trim().toLowerCase());
        return names.some((name) => categories.includes(name));
      }
      if (rule.applyTo === "custom") {
        const names = (rule.categoryNames || []).map((name) => String(name).trim().toLowerCase());
        return (
          (rule.productIds || []).some((pid) => String(pid) === id) ||
          names.some((name) => categories.includes(name))
        );
      }
      return false;
    })
    .map((rule) => ({
      id: String(rule._id),
      ruleType: rule.ruleType || "quantity_discount",
      name: rule.name,
      minQuantity: rule.minQuantity || 1,
      discountType: rule.discountType || "percentage",
      discountValue: rule.discountValue || 0,
      tiers: Array.isArray(rule.tiers) ? rule.tiers : [],
    }));
}

/**
 * Attaches quantity discounts and dynamic promotions to an array of products.
 */
export async function attachQuantityDiscounts(products = []) {
  if (!Array.isArray(products) || products.length === 0) return products;
  const rules = await getActivePricingRules();
  if (!rules.length) {
    return products.map((product) => ({
      ...product,
      quantityDiscounts: product.quantityDiscounts || [],
    }));
  }
  return products.map((product) => ({
    ...product,
    quantityDiscounts: matchRulesForProduct(product, rules),
  }));
}

/**
 * Detects whether a cart item is classified as heavy.
 */
function isHeavyItem(item, product, heavyRule) {
  if (product?.isHeavy === true || item?.isHeavy === true) return true;

  const thresholdKg = Number(heavyRule?.heavyWeightThresholdKg) || 5;

  const weight = Number(product?.weight ?? item?.weight);
  if (Number.isFinite(weight) && weight >= thresholdKg) return true;

  const { id, categories } = getProductCategoriesAndId(product || item);

  if (heavyRule?.applyTo === "products" || heavyRule?.productIds?.length) {
    if ((heavyRule.productIds || []).some((pid) => String(pid) === id)) return true;
  }

  if (heavyRule?.applyTo === "categories" || heavyRule?.categoryNames?.length) {
    const heavyCategories = (heavyRule.categoryNames || []).map((c) => String(c).trim().toLowerCase());
    if (heavyCategories.some((hc) => categories.includes(hc))) return true;
  }

  // Check unit string or product title for heavy indicators (e.g. "5 kg", "10 kg", "25 kg", "sack", "crate")
  const textToCheck = `${item?.name || ""} ${product?.name || ""} ${product?.unit || ""} ${item?.unit || ""}`.toLowerCase();
  const heavyRegex = /(?:^|\s)(?:[5-9]|\d{2,})\s*(?:kg|kilo|kgs)\b|\b(sack|crate|heavy|5kg|10kg|25kg|50kg|watermelon|flour bag|rice bag)\b/i;
  if (heavyRegex.test(textToCheck)) return true;

  return false;
}

/**
 * Core dynamic pricing engine:
 * Evaluates all 6 dynamic pricing strategies for an order/cart:
 * 1. Quantity-based discounts
 * 2. Bundle pricing (with exceptions)
 * 3. Tiered quantity discounts
 * 4. Free/discounted add-on items with a purchase
 * 5. Lifetime loyalty discounts after a set number of orders
 * 6. Extra handling fee for heavy items
 */
export async function evaluateDynamicPricingForCart({
  items = [],
  userId = null,
  subtotal = 0,
}) {
  const activeRules = await getActivePricingRules();

  const result = {
    quantityDiscount: 0,
    tieredDiscount: 0,
    bundleDiscount: 0,
    loyaltyDiscount: 0,
    totalDiscount: 0,
    heavyHandlingFee: 0,
    eligibleAddons: [],
    freeAddon: null,
    appliedRules: [],
    breakdown: [],
  };

  if (!Array.isArray(items) || items.length === 0) {
    return result;
  }

  const safeSubtotal = Number(subtotal) || items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);

  // Group rules by ruleType
  const quantityRules = [];
  const tieredRules = [];
  const bundleRules = [];
  const addonRules = [];
  const loyaltyRules = [];
  const heavyRules = [];

  for (const rule of activeRules) {
    const type = rule.ruleType || "quantity_discount";
    if (type === "quantity_discount") quantityRules.push(rule);
    else if (type === "tiered_quantity") tieredRules.push(rule);
    else if (type === "bundle_pricing") bundleRules.push(rule);
    else if (type === "free_addon") addonRules.push(rule);
    else if (type === "loyalty_discount") loyaltyRules.push(rule);
    else if (type === "heavy_handling_fee") heavyRules.push(rule);
  }

  // -------------------------------------------------------------
  // 1 & 3: Quantity-based discounts & Tiered quantity discounts
  // -------------------------------------------------------------
  for (const item of items) {
    const prod = item.product && typeof item.product === "object" ? item.product : item;
    const { id, categories } = getProductCategoriesAndId(prod);
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const lineTotal = price * qty;

    // Check Tiered Quantity rules first (more specific)
    let itemTieredDiscount = 0;
    let matchedTierRule = null;

    for (const rule of tieredRules) {
      const matchProduct =
        rule.applyTo === "all" ||
        (rule.applyTo === "products" && (rule.productIds || []).some((pid) => String(pid) === id)) ||
        (rule.applyTo === "categories" &&
          (rule.categoryNames || []).some((cn) => categories.includes(String(cn).trim().toLowerCase()))) ||
        (rule.applyTo === "custom" &&
          ((rule.productIds || []).some((pid) => String(pid) === id) ||
            (rule.categoryNames || []).some((cn) => categories.includes(String(cn).trim().toLowerCase()))));

      if (!matchProduct || !Array.isArray(rule.tiers) || !rule.tiers.length) continue;

      const applicableTiers = rule.tiers
        .filter((t) => qty >= Number(t.minQuantity || 0) && (t.maxQuantity == null || qty <= Number(t.maxQuantity)))
        .sort((a, b) => Number(b.minQuantity) - Number(a.minQuantity));

      if (applicableTiers.length > 0) {
        const tier = applicableTiers[0];
        const val = Number(tier.discountValue) || 0;
        let discountPerUnit = 0;
        if (tier.discountType === "fixed") {
          discountPerUnit = Math.min(price, val);
        } else {
          discountPerUnit = (price * Math.min(100, Math.max(0, val))) / 100;
        }
        const totalTierDiscount = Math.round(discountPerUnit * qty * 100) / 100;
        if (totalTierDiscount > itemTieredDiscount) {
          itemTieredDiscount = totalTierDiscount;
          matchedTierRule = { rule, tier, savings: totalTierDiscount };
        }
      }
    }

    if (itemTieredDiscount > 0) {
      result.tieredDiscount += itemTieredDiscount;
      result.breakdown.push({
        type: "tiered_quantity",
        ruleId: matchedTierRule.rule._id,
        ruleName: matchedTierRule.rule.name,
        productName: item.name || prod.name,
        savings: itemTieredDiscount,
        details: `Tier ${matchedTierRule.tier.minQuantity}${matchedTierRule.tier.maxQuantity ? `–${matchedTierRule.tier.maxQuantity}` : "+"} units (${matchedTierRule.tier.discountValue}${matchedTierRule.tier.discountType === "fixed" ? "₹" : "%"} off)`,
      });
      continue; // Item already got tiered volume pricing
    }

    // Check Single Threshold Quantity rules
    let itemQtyDiscount = 0;
    let matchedQtyRule = null;

    for (const rule of quantityRules) {
      const matchProduct =
        rule.applyTo === "all" ||
        (rule.applyTo === "products" && (rule.productIds || []).some((pid) => String(pid) === id)) ||
        (rule.applyTo === "categories" &&
          (rule.categoryNames || []).some((cn) => categories.includes(String(cn).trim().toLowerCase()))) ||
        (rule.applyTo === "custom" &&
          ((rule.productIds || []).some((pid) => String(pid) === id) ||
            (rule.categoryNames || []).some((cn) => categories.includes(String(cn).trim().toLowerCase()))));

      if (!matchProduct) continue;

      const minQty = Number(rule.minQuantity) || 1;
      if (qty >= minQty) {
        const val = Number(rule.discountValue) || 0;
        let discountPerUnit = 0;
        if (rule.discountType === "fixed") {
          discountPerUnit = Math.min(price, val);
        } else {
          discountPerUnit = (price * Math.min(100, Math.max(0, val))) / 100;
        }
        const totalDiscount = Math.round(discountPerUnit * qty * 100) / 100;
        if (totalDiscount > itemQtyDiscount) {
          itemQtyDiscount = totalDiscount;
          matchedQtyRule = { rule, savings: totalDiscount };
        }
      }
    }

    if (itemQtyDiscount > 0) {
      result.quantityDiscount += itemQtyDiscount;
      result.breakdown.push({
        type: "quantity_discount",
        ruleId: matchedQtyRule.rule._id,
        ruleName: matchedQtyRule.rule.name,
        productName: item.name || prod.name,
        savings: itemQtyDiscount,
        details: `Buy ${matchedQtyRule.rule.minQuantity}+ units (${matchedQtyRule.rule.discountValue}${matchedQtyRule.rule.discountType === "fixed" ? "₹" : "%"} off)`,
      });
    }
  }

  // -------------------------------------------------------------
  // 2: Bundle Pricing (e.g. 3 items for fixed ₹999, with exceptions)
  // -------------------------------------------------------------
  for (const rule of bundleRules) {
    const bundleQty = Number(rule.bundleQuantity) || 3;
    const bundlePrice = Number(rule.bundlePrice) || 0;
    if (bundleQty < 1) continue;

    const exceptionIds = (rule.exceptionProductIds || []).map((id) => String(id));
    const exceptionCategories = (rule.exceptionCategoryNames || []).map((c) => String(c).trim().toLowerCase());

    // Filter qualifying units across the cart
    const qualifyingUnits = [];

    for (const item of items) {
      const prod = item.product && typeof item.product === "object" ? item.product : item;
      const { id, categories } = getProductCategoriesAndId(prod);

      // Check exceptions
      if (exceptionIds.includes(id)) continue;
      if (exceptionCategories.some((ec) => categories.includes(ec))) continue;

      // Check inclusion
      const matchesInclusion =
        rule.applyTo === "all" ||
        (rule.applyTo === "products" && (rule.productIds || []).some((pid) => String(pid) === id)) ||
        (rule.applyTo === "categories" &&
          (rule.categoryNames || []).map((c) => String(c).trim().toLowerCase()).some((c) => categories.includes(c))) ||
        (rule.applyTo === "custom" &&
          ((rule.productIds || []).some((pid) => String(pid) === id) ||
            (rule.categoryNames || []).map((c) => String(c).trim().toLowerCase()).some((c) => categories.includes(c))));

      if (matchesInclusion) {
        const itemQty = Number(item.quantity) || 1;
        const itemPrice = Number(item.price) || 0;
        for (let q = 0; q < itemQty; q++) {
          qualifyingUnits.push({
            name: item.name || prod.name,
            price: itemPrice,
            productId: id,
          });
        }
      }
    }

    const bundlesFormed = Math.floor(qualifyingUnits.length / bundleQty);
    if (bundlesFormed > 0) {
      // Sort qualifying units descending by price to provide best bundle benefit
      qualifyingUnits.sort((a, b) => b.price - a.price);

      const totalBundledUnits = bundlesFormed * bundleQty;
      const unitsInBundles = qualifyingUnits.slice(0, totalBundledUnits);
      const standardCostOfBundles = unitsInBundles.reduce((sum, u) => sum + u.price, 0);
      const discountedBundleTotal = bundlesFormed * bundlePrice;

      if (standardCostOfBundles > discountedBundleTotal) {
        const bundleSavings = Math.round((standardCostOfBundles - discountedBundleTotal) * 100) / 100;
        result.bundleDiscount += bundleSavings;
        result.breakdown.push({
          type: "bundle_pricing",
          ruleId: rule._id,
          ruleName: rule.name,
          bundlesFormed,
          bundleQuantity: bundleQty,
          bundlePrice,
          savings: bundleSavings,
          details: `${bundlesFormed}x bundle of ${bundleQty} items for ₹${bundlePrice} (Save ₹${bundleSavings})`,
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 4: Free/discounted add-on items with a purchase
  // -------------------------------------------------------------
  for (const rule of addonRules) {
    let triggered = false;

    if (rule.triggerType === "min_spend") {
      triggered = safeSubtotal >= (Number(rule.minSpend) || 0);
    } else if (rule.triggerType === "any_order") {
      triggered = true;
    } else if (rule.triggerType === "specific_products") {
      const triggerIds = (rule.triggerProductIds || []).map((id) => String(id));
      triggered = items.some((it) => {
        const pid = String(it.productId || it.product?._id || it.product || "");
        return triggerIds.includes(pid);
      });
    } else if (rule.triggerType === "specific_categories") {
      const triggerCategories = (rule.triggerCategoryNames || []).map((c) => String(c).trim().toLowerCase());
      triggered = items.some((it) => {
        const prod = it.product && typeof it.product === "object" ? it.product : it;
        const { categories } = getProductCategoriesAndId(prod);
        return triggerCategories.some((tc) => categories.includes(tc));
      });
    }

    if (triggered && (rule.addonProductId || rule.addonProductName)) {
      const addon = {
        ruleId: String(rule._id),
        ruleName: rule.name,
        productId: rule.addonProductId ? String(rule.addonProductId) : null,
        name: rule.addonProductName || "Bonus Add-on Item",
        quantity: Number(rule.addonQuantity) || 1,
        discountType: rule.addonDiscountType || "free",
        discountValue: Number(rule.addonDiscountValue) || 100,
        isFree: (rule.addonDiscountType || "free") === "free" || Number(rule.addonDiscountValue) >= 100,
      };
      result.eligibleAddons.push(addon);
    }
  }

  if (result.eligibleAddons.length > 0) {
    result.freeAddon = result.eligibleAddons[0];
    result.breakdown.push({
      type: "free_addon",
      ruleId: result.freeAddon.ruleId,
      ruleName: result.freeAddon.ruleName,
      addonName: result.freeAddon.name,
      quantity: result.freeAddon.quantity,
      details: `${result.freeAddon.isFree ? "Free" : "Discounted"} Add-on: ${result.freeAddon.name}`,
    });
  }

  // -------------------------------------------------------------
  // 5: Lifetime loyalty discounts after a set number of orders
  // -------------------------------------------------------------
  if (userId && loyaltyRules.length > 0) {
    try {
      const Order = mongoose.models.Order || (await import("../../legacy/models/order/Order.js")).default;
      const completedOrderCount = await Order.countDocuments({
        user: userId,
        status: { $in: ["delivered", "confirm", "processing", "shipping"] },
      });

      let bestLoyalty = null;
      let maxLoyaltyDiscount = 0;

      for (const rule of loyaltyRules) {
        const requiredOrders = Number(rule.minCompletedOrders) || 1;
        const minSpend = Number(rule.minOrderValue) || 0;

        if (completedOrderCount >= requiredOrders && safeSubtotal >= minSpend) {
          const discountVal = Number(rule.discountValue) || 0;
          let calculated = 0;
          if (rule.discountType === "fixed") {
            calculated = discountVal;
          } else {
            calculated = (safeSubtotal * Math.min(100, discountVal)) / 100;
          }

          if (Number(rule.maxDiscountAmount) > 0) {
            calculated = Math.min(calculated, Number(rule.maxDiscountAmount));
          }

          calculated = Math.round(calculated * 100) / 100;

          if (calculated > maxLoyaltyDiscount) {
            maxLoyaltyDiscount = calculated;
            bestLoyalty = {
              rule,
              savings: calculated,
              completedOrderCount,
            };
          }
        }
      }

      if (bestLoyalty && maxLoyaltyDiscount > 0) {
        result.loyaltyDiscount = maxLoyaltyDiscount;
        result.breakdown.push({
          type: "loyalty_discount",
          ruleId: bestLoyalty.rule._id,
          ruleName: bestLoyalty.rule.name,
          savings: maxLoyaltyDiscount,
          pastOrders: completedOrderCount,
          details: `Lifetime Loyalty Tier (${completedOrderCount} previous orders completed): ₹${maxLoyaltyDiscount} off`,
        });
      }
    } catch (err) {
      console.warn("Loyalty discount evaluation skipped:", err.message);
    }
  }

  // -------------------------------------------------------------
  // 6: Extra handling fee for heavy items
  // -------------------------------------------------------------
  if (heavyRules.length > 0) {
    for (const rule of heavyRules) {
      const heavyItems = [];
      let totalHeavyUnits = 0;
      let totalHeavyKg = 0;

      for (const item of items) {
        const prod = item.product && typeof item.product === "object" ? item.product : item;
        if (isHeavyItem(item, prod, rule)) {
          const qty = Number(item.quantity) || 1;
          const weightKg = Number(prod?.weight || item?.weight || rule.heavyWeightThresholdKg || 5);
          heavyItems.push({
            name: item.name || prod.name,
            quantity: qty,
            weightKg,
          });
          totalHeavyUnits += qty;
          totalHeavyKg += weightKg * qty;
        }
      }

      if (totalHeavyUnits > 0) {
        const feeAmount = Number(rule.feeAmount) || 0;
        let calculatedFee = 0;

        if (rule.feeType === "per_item") {
          calculatedFee = feeAmount * totalHeavyUnits;
        } else if (rule.feeType === "per_kg_over_threshold") {
          const threshold = Number(rule.heavyWeightThresholdKg) || 5;
          const excessKg = Math.max(0, totalHeavyKg - threshold);
          calculatedFee = Math.round(feeAmount * excessKg * 100) / 100;
        } else {
          // default: per_order
          calculatedFee = feeAmount;
        }

        if (calculatedFee > 0) {
          result.heavyHandlingFee += calculatedFee;
          result.breakdown.push({
            type: "heavy_handling_fee",
            ruleId: rule._id,
            ruleName: rule.name,
            fee: calculatedFee,
            heavyUnits: totalHeavyUnits,
            details: `Heavy item handling surcharge (${totalHeavyUnits} heavy item${totalHeavyUnits > 1 ? "s" : ""}): +₹${calculatedFee}`,
          });
        }
      }
    }
  }

  result.totalDiscount =
    Math.round(
      (result.quantityDiscount + result.tieredDiscount + result.bundleDiscount + result.loyaltyDiscount) * 100
    ) / 100;

  result.appliedRules = result.breakdown;

  return result;
}

export async function seedDefaultPricingRule() {
  const existing = await DynamicPricingRule.countDocuments();
  if (existing > 0) return;

  const defaultRules = [
    {
      name: "Buy 10 units · Get 5% off",
      description: "Standard bulk discount for ordering 10 or more units",
      ruleType: "quantity_discount",
      enabled: true,
      minQuantity: 10,
      discountType: "percentage",
      discountValue: 5,
      applyTo: "all",
    },
    {
      name: "Produce Bundle: 3 for ₹299",
      description: "Buy any 3 eligible grocery/produce items for fixed ₹299 (Premium spices excluded)",
      ruleType: "bundle_pricing",
      enabled: true,
      bundleQuantity: 3,
      bundlePrice: 299,
      applyTo: "all",
      exceptionCategoryNames: ["Exotic", "Spices"],
    },
    {
      name: "Tiered Volume Discounts (2–5 units at 10%, 6+ at 20%)",
      description: "Progressive tiered slabs for volume purchases",
      ruleType: "tiered_quantity",
      enabled: true,
      applyTo: "all",
      tiers: [
        { minQuantity: 2, maxQuantity: 5, discountType: "percentage", discountValue: 10 },
        { minQuantity: 6, maxQuantity: null, discountType: "percentage", discountValue: 20 },
      ],
    },
    {
      name: "Free Fresh Mint Bunch on Orders over ₹499",
      description: "Complimentary herb bunch with high-value cart orders",
      ruleType: "free_addon",
      enabled: true,
      triggerType: "min_spend",
      minSpend: 499,
      addonProductName: "Fresh Mint Leaves (Pudina)",
      addonQuantity: 1,
      addonDiscountType: "free",
      addonDiscountValue: 100,
    },
    {
      name: "VIP Club: 10% Lifetime Loyalty Discount after 5 Orders",
      description: "Automatic lifetime savings reward for loyal repeat patrons",
      ruleType: "loyalty_discount",
      enabled: true,
      minCompletedOrders: 5,
      discountType: "percentage",
      discountValue: 10,
      maxDiscountAmount: 300,
      minOrderValue: 199,
    },
    {
      name: "Heavy Goods Handling Surcharge (≥ 5kg)",
      description: "Covers special transport and delivery logistics for bulky items",
      ruleType: "heavy_handling_fee",
      enabled: true,
      feeAmount: 40,
      feeType: "per_order",
      heavyWeightThresholdKg: 5,
      applyTo: "weight_threshold",
    },
  ];

  await DynamicPricingRule.insertMany(defaultRules);
  invalidatePricingCache();
}
