import "dotenv/config";
import mongoose from "mongoose";
import StoreInventory from "./delivery-service/src/models/StoreInventory.js";

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const inv = await StoreInventory.updateMany(
  { sku: { $in: ["GGC-ART-SPC-CAP-PAN-1", "PR-SPC-PEPPER"] } },
  { $set: { sku: "GGC-ART-SPC-PEP-PAN-1" } }
);
const leftover = await StoreInventory.countDocuments({ sku: /^PR-/ });
console.log(`updated ${inv.modifiedCount}; store rows still on PR- SKUs: ${leftover}`);
await mongoose.disconnect();
process.exit(0);
