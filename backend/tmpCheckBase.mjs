import "dotenv/config";
import mongoose from "mongoose";
import Product from "./legacy/models/Product.js";

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || undefined });
for (const section of ["preorder", "instantorder"]) {
  const list = await Product.find({ section, ownerManagerId: null }).select("baseProductId stock inStock isActive").lean();
  const summary = {
    total: list.length,
    withBase: list.filter((p) => p.baseProductId).length,
    stockAbove0: list.filter((p) => Number(p.stock) > 0).length,
    inStockFalse: list.filter((p) => p.inStock === false).length,
    inactive: list.filter((p) => p.isActive === false).length,
  };
  console.log(section, JSON.stringify(summary));
}
await mongoose.disconnect();
