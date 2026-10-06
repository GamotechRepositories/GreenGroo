import Product from "../../../legacy/models/Product.js";
import StoreInventory from "../models/StoreInventory.js";
import DeliveryManager from "../models/DeliveryManager.js";

/**
 * Admin catalog products are listed in every dark store's inventory, starting at
 * 0 units, so each store can see them and request stock.
 */

const isAdminProduct = (product) => Boolean(product?._id) && !product.ownerManagerId;

/** Same fallback SKU the order dispatcher uses for products without one. */
export function inventorySkuForProduct(product) {
  const sku = String(product?.sku || "").trim();
  if (sku) return sku;
  const id = String(product?._id || "");
  return id ? `P-${id.slice(-8)}` : "";
}

function catalogFields(product) {
  return {
    name: product.name,
    category: product.categories?.[0] || product.subcategory || "General",
    unit: product.unit || "pcs",
    price: Number(product.discountedPrice ?? product.price) || 0,
  };
}

function zeroStockUpsert(product, managerId) {
  const sku = inventorySkuForProduct(product);
  if (!sku) return null;
  return {
    updateOne: {
      filter: { managerId, sku },
      update: {
        $setOnInsert: {
          managerId,
          sku,
          ...catalogFields(product),
          stockCount: 0,
          lowStockThreshold: 10,
          isActive: true,
        },
      },
      upsert: true,
    },
  };
}

async function writeUpserts(ops) {
  const valid = ops.filter(Boolean);
  if (!valid.length) return 0;
  const result = await StoreInventory.bulkWrite(valid, { ordered: false });
  return result.upsertedCount || 0;
}

const upsertRows = (product, managerIds) =>
  writeUpserts(managerIds.map((managerId) => zeroStockUpsert(product, managerId)));

async function activeStoreIds() {
  const stores = await DeliveryManager.find({ isActive: true }).select("_id").lean();
  return stores.map((store) => store._id);
}

/** Add a newly created admin product to every active dark store with 0 stock. */
export async function addProductToAllStores(product) {
  if (!isAdminProduct(product)) return 0;
  return upsertRows(product, await activeStoreIds());
}

/**
 * Keep store rows in step with an edited admin product: follow a SKU change,
 * refresh name/price/unit/category, and add the product to stores missing it.
 */
export async function syncProductToStores(product, previous = null) {
  if (!isAdminProduct(product)) return 0;
  const sku = inventorySkuForProduct(product);
  const previousSku = previous ? inventorySkuForProduct(previous) : sku;

  if (previousSku && previousSku !== sku) {
    const alreadyHasNew = await StoreInventory.distinct("managerId", { sku });
    await StoreInventory.updateMany(
      { sku: previousSku, managerId: { $nin: alreadyHasNew } },
      { $set: { sku } }
    );
  }

  await StoreInventory.updateMany({ sku }, { $set: catalogFields(product) });
  return upsertRows(product, await activeStoreIds());
}

/** List every active admin product in one dark store (new stores, backfills). */
export async function addCatalogToStore(managerId) {
  if (!managerId) return 0;
  const products = await Product.find({ ownerManagerId: null, isActive: true })
    .select("_id sku name categories subcategory unit price discountedPrice")
    .lean();
  return writeUpserts(products.map((product) => zeroStockUpsert(product, managerId)));
}
