import "dotenv/config";
import mongoose from "mongoose";
import { importDefaultBanners } from "../services/defaultBanners.js";

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
try {
  const summary = await importDefaultBanners({ log: (line) => console.log(`  ${line}`) });
  console.log(`created ${summary.created}, already imported ${summary.skipped}`);
  if (summary.missing.length) console.log(`missing files: ${summary.missing.join(", ")}`);
} finally {
  await mongoose.disconnect();
}
