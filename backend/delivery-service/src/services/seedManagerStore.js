import StoreInventory from "../models/StoreInventory.js";
import { buildInventoryDocs } from "../data/storeProductCatalog.js";
import { ensureStoreCatalogProducts } from "./ensureStoreCatalogProducts.js";

export async function seedManagerStore(manager) {
  await ensureStoreCatalogProducts();

  const existing = await StoreInventory.countDocuments({
    managerId: manager._id,
  });
  if (existing > 0) {
    return { inventoryCreated: 0, ordersCreated: 0 };
  }

  const docs = buildInventoryDocs(manager._id);
  await StoreInventory.insertMany(docs);

  return { inventoryCreated: docs.length, ordersCreated: 0 };
}
