import "dotenv/config";
import mongoose from "mongoose";
import StoreInventory from "./delivery-service/src/models/StoreInventory.js";

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const rows = await StoreInventory.find({ sku: /^PR-/ }).select("managerId productId sku name").lean();
for (const r of rows) console.log(`${r.managerId} | ${r.productId} | ${r.sku} | ${r.name}`);
const managers = await StoreInventory.distinct("managerId");
console.log("stores:", managers.length);
await mongoose.disconnect();
process.exit(0);
