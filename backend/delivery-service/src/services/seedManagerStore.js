import StoreInventory from "../models/StoreInventory.js";
import StoreOrder from "../models/StoreOrder.js";
import {
  buildInventoryDocs,
  pickRandomItems,
} from "../data/storeProductCatalog.js";

export async function seedManagerStore(manager) {
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
