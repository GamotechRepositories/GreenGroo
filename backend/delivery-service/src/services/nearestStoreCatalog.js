import StoreInventory from "../models/StoreInventory.js";
import Product from "../../../legacy/models/Product.js";
import { resolveDarkStoreForOrder } from "./darkStoreResolver.js";
import { inventorySkuForProduct } from "./catalogStoreInventory.js";
import { sectionToDepartment } from "../../../legacy/utils/departmentHelpers.js";
import { geocodeAddressString } from "../../../legacy/services/reverseGeocodeService.js";

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
  const storeName = manager.storeName || `${manager.area || "Dark"} Store`;
  return {
    id: manager._id?.toString?.() || manager.id,
    storeName,
    area: manager.area || "",
    city: manager.city || "",
    state: manager.state || "",
    pincode: manager.pincode || "",
    phone: manager.phone || "",
    address:
      manager.storeAddress ||
      [storeName, manager.area, manager.city, manager.state, manager.pincode]
        .filter(Boolean)
        .join(", "),
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

export function mongoMatchForInventory(items) {
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
  const sku = inventorySkuForProduct(product).toUpperCase();
  const productName = norm(product?.name);

  if (sku) {
    const exact = items.find((item) => String(item.sku || "").trim().toUpperCase() === sku);
    if (exact) return exact;
  }
  // Store-owned products always have their own inventory row; a name match would
  // borrow another item's stock and price.
  if (product?.ownerManagerId) return null;

  for (const item of items) {
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

export async function resolveMatchingProducts(items) {
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
  const hasStore = Boolean(catalog?.store?.id || catalog?.store?._id || catalog?.manager);
  // No location yet → keep catalog stock as-is. A known location with no dark
  // store serving it falls through and shows everything out of stock.
  if (!hasStore && catalog?.needsLocation !== false) {
    return {
      ...doc,
      storeStock: null,
      storeSku: "",
      storeCategory: "",
      storeId: null,
      storeName: "",
      storeArea: "",
    };
  }

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
    storeId: catalog?.store?.id || catalog?.store?._id || null,
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
  const address = addressFromQuery(query);
  const needsLocation = !hasLocationHint(address);
  const pickup = String(query.fulfillment || "").trim().toLowerCase() === "pickup";

  if (pickup && !needsLocation && address.lat == null) {
    const text = [address.fullAddress, address.area, address.city, address.pincode]
      .filter(Boolean)
      .join(", ");
    const coords = await geocodeAddressString(text).catch(() => null);
    if (coords) {
      address.lat = coords.lat;
      address.lng = coords.lng;
      address.location = coords;
    }
  }

  const department = sectionToDepartment(query.section, query.storeType);
  const resolved = await resolveDarkStoreForOrder(address, {
    allowPincodeFallback: department === "preorder",
    anyDistance: pickup,
  });
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

/**
 * Products a customer may see: the whole admin catalog, plus the resolved dark
 * store's own products. Admin products the store doesn't stock still show —
 * attachStoreAvailability marks them out of stock.
 */
export function storeProductScope(catalog) {
  const manager = catalog?.manager;
  if (!manager) return { ownerManagerId: null };
  return { $or: [{ ownerManagerId: null }, { ownerManagerId: manager._id }] };
}

export function mergeStoreFilter(baseFilter, _catalog) {
  return baseFilter;
}
