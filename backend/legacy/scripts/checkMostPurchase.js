import "dotenv/config";
import connectDB from "../config/dbconfig.js";
import Product from "../models/Product.js";

await connectDB();

const raw = await Product.collection.find({ isActive: true }).toArray();

console.log("=== Raw documents ===");
for (const doc of raw) {
  console.log({
    _id: doc._id,
    name: doc.name,
    categories: doc.categories,
    categoryName: doc.categoryName,
  });
}

const regexFilter = await Product.find({
  isActive: true,
  categories: { $regex: /^Most Purchase$/i },
});

console.log("\n=== Regex filter on categories ===");
console.log("Count:", regexFilter.length);
regexFilter.forEach((p) => console.log(p._id, p.categories));

const elemMatch = await Product.find({
  isActive: true,
  categories: "Most Purchase",
});

console.log("\n=== Exact match categories: Most Purchase ===");
console.log("Count:", elemMatch.length);

process.exit(0);
