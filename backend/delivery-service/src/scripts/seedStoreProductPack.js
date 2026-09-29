/**
 * Give one dark store the full product range (5 Pre-order, 5 Ready2Cook, 5 Instant).
 * Usage: node delivery-service/src/scripts/seedStoreProductPack.js <managerId|email>
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "@greengrocc/shared";
import DeliveryManager from "../models/DeliveryManager.js";
import { addStoreProducts } from "../services/seedManagerStore.js";
import { STORE_PRODUCT_PACK } from "../data/storeProductCatalog.js";

async function main() {
  const key = String(process.argv[2] || "").trim();
  if (!key) throw new Error("Pass a delivery manager id or email");

  await connectDB("seed-store-product-pack");
  const manager = mongoose.Types.ObjectId.isValid(key)
    ? await DeliveryManager.findById(key)
    : await DeliveryManager.findOne({ email: key.toLowerCase() });
  if (!manager) throw new Error(`Delivery manager not found: ${key}`);

  const result = await addStoreProducts(manager, STORE_PRODUCT_PACK);
  if (!manager.storeSeededAt) {
    await DeliveryManager.updateOne({ _id: manager._id }, { $set: { storeSeededAt: new Date() } });
  }
  console.log(
    `${manager.storeName} (${manager.area}, ${manager.pincode}): +${result.productsCreated} products, +${result.inventoryCreated} inventory rows`
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
