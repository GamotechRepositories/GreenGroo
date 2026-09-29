import Product from "../../../legacy/models/Product.js";
import StoreInventory from "../models/StoreInventory.js";
import DeliveryManager from "../models/DeliveryManager.js";
import {
  STARTER_STORE_PRODUCTS,
  buildStarterInventoryDoc,
  buildStarterProductDoc,
} from "../data/storeProductCatalog.js";

async function markSeeded(manager) {
  const now = new Date();
  manager.storeSeededAt = now;
  await DeliveryManager.updateOne({ _id: manager._id }, { $set: { storeSeededAt: now } });
}

/**
 * Create store-owned products (visible only to this store's customers) plus the
 * matching inventory rows. Items the store already has are left untouched.
 */
export async function addStoreProducts(manager, entries) {
  let productsCreated = 0;
  let inventoryCreated = 0;

  for (const entry of entries) {
    const productDoc = buildStarterProductDoc(entry, manager._id);
    const productResult = await Product.updateOne(
      { sku: productDoc.sku },
      { $setOnInsert: productDoc },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    productsCreated += productResult.upsertedCount || 0;

    const inventoryDoc = buildStarterInventoryDoc(entry, manager._id);
    const inventoryResult = await StoreInventory.updateOne(
      { managerId: manager._id, sku: inventoryDoc.sku },
      { $setOnInsert: inventoryDoc },
      { upsert: true }
    );
    inventoryCreated += inventoryResult.upsertedCount || 0;
  }

  return { productsCreated, inventoryCreated };
}

/**
 * Give a new dark store its starter products. Runs once per store: stores that
 * already have inventory, or were seeded before, are left untouched.
 */
export async function seedManagerStore(manager) {
  const empty = { productsCreated: 0, inventoryCreated: 0, ordersCreated: 0 };
  if (!manager?._id || manager.storeSeededAt) return empty;

  const existing = await StoreInventory.countDocuments({ managerId: manager._id });
  if (existing > 0) {
    await markSeeded(manager);
    return empty;
  }

  const result = await addStoreProducts(manager, STARTER_STORE_PRODUCTS);
  await markSeeded(manager);
  return { ...result, ordersCreated: 0 };
}
