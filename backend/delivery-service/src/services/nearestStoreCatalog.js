import StoreInventory from "../models/StoreInventory.js";
import Product from "../../../legacy/models/Product.js";
import { resolveDarkStoreForAddress } from "./darkStoreResolver.js";
import { ensureStoreCatalogProducts } from "./ensureStoreCatalogProducts.js";

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const norm = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const CATEGORY_ALIASES = {
  staples: ["staples", "grains"],
  grains: ["staples", "grains"],
  grocery: ["staples", "snacks", "household", "ready to cook", "grocery"],
  pulses: ["staples", "pulses"],
  oils: ["staples", "oils"],
  bakery: ["bakery"],
  "ready to cook": ["ready to cook"],
  "personal care": ["personal care"],
  household: ["household"],
  beverages: ["beverages"],
  snacks: ["snacks"],
};

export function addressFromQuery(query = {}) {
  const lat = toNumber(query.lat ?? query.latitude);
  const lng = toNumber(query.lng ?? query.longitude);
  return {
    city: String(query.city || "").trim(),
    area: String(query.area || "").trim(),
    pincode: String(query.pincode || "").trim(),
    fullAddress: String(query.address || query.fullAddress || "").trim(),
    landmark: String(query.area || "").trim(),
    lat,
    lng,
    location: lat != null && lng != null ? { lat, lng } : null,
  };
}

export function hasLocationHint(address = {}) {
  return Boolean(
    address.city ||
      address.area ||
      address.pincode ||
      address.fullAddress ||
      (address.lat != null && address.lng != null) ||
      address.location?.lat != null
  );
}

export function storePublicPayload(manager, extra = {}) {
  if (!manager) return null;
  return {
    id: manager._id?.toString?.() || manager.id,
    storeName: manager.storeName || `${manager.area || "Dark"} Store`,
    area: manager.area || "",
    city: manager.city || "",
    state: manager.state || "",
    latitude: manager.latitude,
    longitude: manager.longitude,
    ...extra,
  };
}

function wordBoundaryRegex(name) {
  return `(^|[^A-Za-z0-9])${escapeRegex(name)}([^A-Za-z0-9]|$)`;
}

function stemBoundaryRegex(name) {
  const stem = String(name || "").trim().replace(/s$/i, "");
  if (stem.length < 4) return wordBoundaryRegex(name);
  return `(^|[^A-Za-z0-9])${escapeRegex(stem)}[A-Za-z]{0,4}([^A-Za-z0-9]|$)`;
}

function mongoMatchForInventory(items) {
  if (!items.length) return { _id: { $in: [] } };

  const skus = [
    ...new Set(
      items.flatMap((item) => {
        const sku = String(item.sku || "").trim();
        if (!sku) return [];
        return [sku, sku.toUpperCase(), sku.toLowerCase()];
      })
    ),
  ];

  const nameClauses = [];
  items.forEach((item) => {
    const name = String(item.name || "").trim();
    if (!name) return;
    nameClauses.push({
      name: { $regex: stemBoundaryRegex(name), $options: "i" },
    });
    const last = name.split(/\s+/).pop();
    if (last && last.length >= 4 && last.toLowerCase() !== name.toLowerCase() && isStrongWord(last)) {
      nameClauses.push({
        name: { $regex: stemBoundaryRegex(last), $options: "i" },
      });
    }
  });

  const or = [];
  if (skus.length) or.push({ sku: { $in: skus } });
  or.push(...nameClauses);

  return or.length ? { $or: or } : { _id: { $in: [] } };
}

function nameOccurs(productName, itemName) {
  if (!productName || !itemName) return false;
  if (productName === itemName) return true;
  if (productName.startsWith(`${itemName} `) || productName.endsWith(` ${itemName}`)) {
    return true;
  }
  if (new RegExp(`(^| )${escapeRegex(itemName)}( |$)`).test(productName)) return true;
  const stem = itemName.replace(/s$/, "");
  if (stem.length >= 4) {
    return new RegExp(`(^| )${escapeRegex(stem)}[a-z]{0,4}( |$)`).test(productName);
  }
  return false;
}

export function matchProductToItem(product, items) {
  const sku = String(product?.sku || "").trim().toUpperCase();
  const productName = norm(product?.name);

  for (const item of items) {
    const itemSku = String(item.sku || "").trim().toUpperCase();
    if (sku && itemSku && sku === itemSku) return item;
    const itemName = norm(item.name);
    if (!itemName || !productName) continue;
    if (nameOccurs(productName, itemName)) return item;
    const lastWord = itemName.split(" ").pop();
    if (lastWord && lastWord !== itemName && isStrongWord(lastWord) && nameOccurs(productName, lastWord)) {
      return item;
    }
  }
  return null;
}

const WEAK_NAME_WORDS = new Set([
  "leaves",
  "mix",
  "pack",
  "slices",
  "cream",
  "fresh",
  "whole",
  "super",
  "bar",
  "cup",
]);

function isStrongWord(word) {
  return Boolean(word) && word.length >= 4 && !WEAK_NAME_WORDS.has(word.toLowerCase());
}

function filterItemsByCategory(items, categoryName) {
  const wanted = String(categoryName || "").trim().toLowerCase();
  if (!wanted || wanted === "most purchase") return items;
  const accepted = new Set([wanted, ...(CATEGORY_ALIASES[wanted] || [])]);
  return items.filter((item) => accepted.has(String(item.category || "").toLowerCase()));
}

async function resolveMatchingProducts(items) {
  if (!items.length) return [];

  const match = mongoMatchForInventory(items);
  let found = await Product.find({ isActive: true, ...match })
    .select("_id sku name")
    .lean();

  let matched = found.filter((product) => matchProductToItem(product, items));

  if (!matched.length) {
    const cats = [...new Set(items.map((item) => item.category).filter(Boolean))];
    found = await Product.find({
      isActive: true,
      ...(cats.length ? { categories: { $in: cats } } : {}),
    })
      .select("_id sku name")
      .limit(400)
      .lean();
    matched = found.filter((product) => matchProductToItem(product, items));
  }

  if (!matched.length) {
    const nameOr = items
      .map((item) => String(item.name || "").trim())
      .filter(Boolean)
      .map((name) => ({ name: { $regex: escapeRegex(name), $options: "i" } }));
    if (nameOr.length) {
      found = await Product.find({ isActive: true, $or: nameOr })
        .select("_id sku name")
        .limit(400)
        .lean();
      matched = found.filter((product) => matchProductToItem(product, items));
    }
  }

  return matched;
}

function applyStoreStock(doc, item, catalog) {
  const storeStock = item ? Number(item.stockCount) || 0 : 0;
  const inStock = storeStock > 0;
  const storePrice = Number(item?.price);
  const variants = Array.isArray(doc.variants)
    ? doc.variants.map((variant) => ({
        ...variant,
        inStock,
        stock: storeStock,
      }))
    : doc.variants;
  return {
    ...doc,
    variants,
    inStock,
    stock: storeStock,
    storeStock,
    storeSku: item?.sku || "",
    storeCategory: item?.category || "",
    storeId: catalog?.store?.id || null,
    storeName: catalog?.store?.storeName || "",
    storeArea: catalog?.store?.area || "",
    ...(item && Number.isFinite(storePrice) && storePrice > 0
      ? { discountedPrice: storePrice, price: Math.max(doc.price || storePrice, storePrice) }
      : {}),
  };
}

export function attachStoreAvailability(products, catalog) {
  const list = Array.isArray(products) ? products : [];
  if (!catalog?.requested) return list;

  const items = Array.isArray(catalog.items) ? catalog.items : [];
  return list.map((product) => {
    const doc = product?.toObject ? product.toObject() : { ...product };
    const item = items.length ? matchProductToItem(doc, items) : null;
    return applyStoreStock(doc, item, catalog);
  });
}

export async function loadNearestStoreCatalog(query = {}) {
  await ensureStoreCatalogProducts();

  const address = addressFromQuery(query);
  const needsLocation = !hasLocationHint(address);

  const resolved = await resolveDarkStoreForAddress(address);
  const manager = resolved.manager;
  if (!manager) {
    return {
      requested: true,
      needsLocation,
      manager: null,
      store: null,
      items: [],
      productIds: [],
      productMatch: { _id: { $in: [] } },
      reason: resolved.reason || "no_store",
    };
  }

  const inventory = await StoreInventory.find({
    managerId: manager._id,
    isActive: true,
  }).lean();

  const inStockItems = inventory.filter((item) => Number(item.stockCount) > 0);

  return {
    requested: true,
    needsLocation,
    manager,
    store: storePublicPayload(manager, {
      distanceKm: resolved.distanceKm,
      reason: resolved.reason,
      inStockCount: inStockItems.length,
      categories: [...new Set(inventory.map((item) => item.category).filter(Boolean))],
    }),
    items: inventory,
    productIds: [],
    productMatch: null,
    reason: resolved.reason,
  };
}

export function mergeStoreFilter(baseFilter, _catalog) {
  return baseFilter;
}
