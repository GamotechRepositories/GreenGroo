import "dotenv/config";
import mongoose from "mongoose";
import { listVendorCatalogProducts } from "./farmer-manager-service/src/vendorProductRequestControllers.js";

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const run = (query) =>
  new Promise((resolve) => {
    const res = { status: () => res, json: resolve };
    listVendorCatalogProducts({ user: { vendorId: "test" }, query }, res);
  });
for (const query of [{ page: 3, limit: 24 }, { section: "ready2cook" }]) {
  const out = await run(query);
  console.log(JSON.stringify(query), out.message || "", out.total, JSON.stringify(out.sections), out.categories?.join(","));
  console.log((out.products || []).map((p) => `${p.section}:${p.name}`).slice(0, 30).join(" | "));
}
await mongoose.disconnect();
