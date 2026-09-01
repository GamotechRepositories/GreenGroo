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
  if (now - cache.at < CACHE_MS) return cache.rules;
  const rules = await DynamicPricingRule.find({ enabled: true }).lean();
  cache = { at: now, rules: rules.filter((rule) => ruleIsLive(rule)) };
  return cache.rules;
}

export function invalidatePricingCache() {
  cache = { at: 0, rules: [] };
}

export function matchRulesForProduct(product, rules = []) {
  const id = String(product?._id || product?.id || "");
  const categories = [
    ...(Array.isArray(product?.categories) ? product.categories : []),
    product?.category,
    product?.subcategory,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return rules
    .filter((rule) => {
      if (rule.applyTo === "all") return true;
      if (rule.applyTo === "products") {
        return (rule.productIds || []).some((pid) => String(pid) === id);
      }
      if (rule.applyTo === "categories") {
        const names = (rule.categoryNames || []).map((name) => String(name).trim().toLowerCase());
        return names.some((name) => categories.includes(name));
      }
      return false;
    })
    .map((rule) => ({
      id: String(rule._id),
      name: rule.name,
      minQuantity: rule.minQuantity,
      discountType: rule.discountType,
      discountValue: rule.discountValue,
    }));
}

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

export async function seedDefaultPricingRule() {
  const existing = await DynamicPricingRule.countDocuments();
  if (existing > 0) return;
  await DynamicPricingRule.create({
    name: "Buy 10 units · Get 5% off",
    enabled: true,
    minQuantity: 10,
    discountType: "percentage",
    discountValue: 5,
    applyTo: "all",
  });
  invalidatePricingCache();
}
