import "dotenv/config";
import fs from "node:fs";
import mongoose from "mongoose";

const BACKUP = process.argv[2];
if (!BACKUP) throw new Error("backup path required");

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const products = mongoose.connection.db.collection("GreenGroccproducts");
const FRESH = ["Fruits", "Vegetables"];

const current = await products.find({ hotSelling: true }, { projection: { _id: 1, sku: 1, name: 1 } }).toArray();
fs.writeFileSync(BACKUP, JSON.stringify(current, null, 1));
console.log(`backed up ${current.length} hot-selling flags -> ${BACKUP}`);

const on = await products.updateMany(
  { ownerManagerId: null, isActive: true, categories: { $in: FRESH } },
  { $set: { hotSelling: true } }
);
const off = await products.updateMany(
  { hotSelling: true, categories: { $nin: FRESH } },
  { $set: { hotSelling: false } }
);
console.log(`flagged ${on.matchedCount} fruits/vegetables, unflagged ${off.modifiedCount} others`);
await mongoose.disconnect();
