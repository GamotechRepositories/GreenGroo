import "dotenv/config";
import mongoose from "mongoose";
import { VendorProduct } from "./farmer-manager-service/src/models.js";
import { vendorProductsWithCatalog } from "./farmer-manager-service/src/vendorProductRequestControllers.js";

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const rows = await VendorProduct.find({ vendorId: "vendor-1" }).lean();
console.log(JSON.stringify(rows.map((r) => ({ productId: r.productId, name: r.productName }))));
const merged = await vendorProductsWithCatalog("vendor-1");
console.log(JSON.stringify(merged.map((r) => ({ section: r.section, catalogMissing: r.catalogMissing }))));
await mongoose.disconnect();
