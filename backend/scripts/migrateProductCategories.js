import "dotenv/config";
import connectDB from "../config/dbconfig.js";
import Product from "../models/Product.js";

await connectDB();

const collection = Product.collection;
const rawProducts = await collection.find({}).toArray();

let updated = 0;

for (const doc of rawProducts) {
  let categories = doc.categories;

  if (!Array.isArray(categories) || categories.length === 0) {
    if (Array.isArray(doc.categoryName) && doc.categoryName.length > 0) {
      categories = doc.categoryName
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    } else if (typeof doc.categoryName === "string" && doc.categoryName.trim()) {
      categories = [doc.categoryName.trim()];
    } else if (typeof doc.subcategory === "string" && doc.subcategory.trim()) {
      categories = [doc.subcategory.trim()];
    } else {
      categories = ["Mobile Accessories"];
    }

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: { categories },
        $unset: { categoryName: "" },
      }
    );
    updated += 1;
  }
}

const mostPurchaseCount = await collection.countDocuments({
  isActive: true,
  categories: "Most Purchase",
});

console.log(`Synced categories on ${updated} product(s).`);
console.log(`Active Most Purchase products: ${mostPurchaseCount}`);
process.exit(0);
