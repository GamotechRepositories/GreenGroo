import "dotenv/config";
import connectDB from "../config/dbconfig.js";
import Product from "../models/Product.js";

const MOST_PURCHASE = "Most Purchase";

await connectDB();

const collection = Product.collection;
const rawProducts = await collection.find({ isActive: true }).toArray();

let updated = 0;

for (const doc of rawProducts) {
  const categories = Array.isArray(doc.categories) ? [...doc.categories] : [];
  const hasTag = categories.some(
    (c) => c.toLowerCase() === MOST_PURCHASE.toLowerCase()
  );

  if (hasTag) continue;

  const main = categories[0] || doc.subcategory || "Wireless Earbuds";
  const next = [main, MOST_PURCHASE];

  await collection.updateOne({ _id: doc._id }, { $set: { categories: next } });
  updated += 1;
}

const mostPurchaseCount = await collection.countDocuments({
  isActive: true,
  categories: MOST_PURCHASE,
});

console.log(`Tagged ${updated} product(s) with Most Purchase.`);
console.log(`Active Most Purchase products: ${mostPurchaseCount}`);
process.exit(0);
