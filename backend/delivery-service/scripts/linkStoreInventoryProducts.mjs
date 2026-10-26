// Link every dark-store stock row to its catalog product by exact SKU.
// Usage (from backend/): node delivery-service/scripts/linkStoreInventoryProducts.mjs
import "dotenv/config";
import mongoose from "mongoose";
import StoreInventory from "../src/models/StoreInventory.js";
import { linkAllInventoryToProducts } from "../src/services/catalogStoreInventory.js";

await mongoose.connect(process.env.MONGODB_URI);

const { linked, unlinked } = await linkAllInventoryToProducts();
console.log(`Linked ${linked} stock rows to products.`);

if (unlinked) {
  const rows = await StoreInventory.find({ productId: null })
    .select("managerId sku name stockCount")
    .limit(200)
    .lean();
  console.log(`${unlinked} rows have no product with the same SKU (first ${rows.length}):`);
  for (const row of rows) {
    console.log(`  store ${row.managerId}  sku=${row.sku}  "${row.name}"  stock=${row.stockCount}`);
  }
}

await mongoose.disconnect();
