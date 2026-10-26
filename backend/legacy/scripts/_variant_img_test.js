import "dotenv/config";
import mongoose from "mongoose";
import { createProductRecord, updateProductRecord } from "../controllers/productController.js";
import Product from "../models/Product.js";

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const IMG = "https://greengrocc-s3.s3.ap-south-1.amazonaws.com/products/1793010048784-9874c6cd5c72983a2daec8085186abcb.png";
let id;
try {
  const result = await createProductRecord({
    name: "ZZ Variant Image Test",
    categories: ["Beverages"],
    subcategory: "Soft Drinks & Soda",
    brandName: "GreenGrocc",
    description: "test",
    productImages: [IMG],
    variantType: "multi",
    variants: [
      { name: "250 Gram", quantity: 250, unitType: "Gram", price: 40, discountedPrice: 30, stock: 5, inStock: true, image: IMG },
      { name: "500 Gram", quantity: 500, unitType: "Gram", price: 70, discountedPrice: 60, stock: 5, inStock: true, image: "" },
    ],
    isActive: false,
  });
  const body = result?.body || result;
  id = body?.product?._id || body?.data?._id || body?._id;
  console.log("create status:", result?.status ?? "-", result?.error || result?.message || "");
  if (!id) console.log(JSON.stringify(result).slice(0, 400));
  let doc = await Product.findById(id).lean();
  console.log("after create:", doc?.variants?.map((v) => v.image || "(none)"));
  await updateProductRecord(String(id), {
    ...doc,
    variants: doc.variants.map((v, i) => (i === 1 ? { ...v, image: IMG } : v)),
  });
  doc = await Product.findById(id).lean();
  console.log("after update:", doc?.variants?.map((v) => v.image || "(none)"));
} finally {
  if (id) await Product.deleteOne({ _id: id });
  console.log("cleaned up:", Boolean(id));
  await mongoose.disconnect();
}
