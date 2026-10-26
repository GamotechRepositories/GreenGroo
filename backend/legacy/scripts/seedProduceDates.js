import "dotenv/config";
import fs from "node:fs";
import mongoose from "mongoose";

const BACKUP = process.argv[2];
if (!BACKUP) throw new Error("backup path required");

const FRESH_CATEGORIES = new Set(["vegetables", "fruits", "dairy"]);
const DAY = 24 * 60 * 60 * 1000;
const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const iso = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const products = mongoose.connection.db.collection("GreenGroccproducts");
const list = await products
  .find(
    { ownerManagerId: null },
    { projection: { name: 1, section: 1, categories: 1, harvestingDate: 1, packingDate: 1, "farmerDetails.harvestingDate": 1 } }
  )
  .toArray();
fs.writeFileSync(BACKUP, JSON.stringify(list, null, 1));
console.log(`backed up ${list.length} products -> ${BACKUP}`);

const today = new Date();
today.setHours(0, 0, 0, 0);
const ops = list.map((product) => {
  const category = String(product.categories?.[0] || "").toLowerCase();
  const fresh = product.section === "ready2cook" || FRESH_CATEGORIES.has(category);
  const harvestAgo = fresh ? rand(0, 3) : rand(20, 120);
  const packGap = fresh ? rand(0, 1) : rand(3, 20);
  const harvest = new Date(today.getTime() - harvestAgo * DAY);
  const packing = new Date(Math.min(today.getTime(), harvest.getTime() + packGap * DAY));
  return {
    updateOne: {
      filter: { _id: product._id },
      update: {
        $set: {
          harvestingDate: iso(harvest),
          packingDate: iso(packing),
          ...(product.farmerDetails ? { "farmerDetails.harvestingDate": iso(harvest) } : {}),
        },
      },
    },
  };
});
const result = await products.bulkWrite(ops);
console.log(`updated ${result.modifiedCount} products`);

const sample = await products
  .find({ ownerManagerId: null }, { projection: { name: 1, harvestingDate: 1, packingDate: 1 } })
  .limit(6)
  .toArray();
sample.forEach((p) => console.log(`  ${p.name}: harvest ${p.harvestingDate}, packed ${p.packingDate}`));
await mongoose.disconnect();
