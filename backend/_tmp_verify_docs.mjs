import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "@greengrocc/shared";
import { FarmerDocument } from "./farmer-manager-service/src/models.js";
import { isRealFarmerDocument } from "./farmer-manager-service/src/controllers.js";
import { listFarmers } from "./erp-service/src/controllers/ceoController.js";

await connectDB("verify");
const all = await FarmerDocument.find({}).select("farmerId type status fileUrl").lean();
const real = all.filter(isRealFarmerDocument);
const byStatus = {};
for (const d of real) byStatus[d.status] = (byStatus[d.status] || 0) + 1;
console.log("total docs:", all.length, "real:", real.length, "byStatus:", byStatus);
console.log(
  "sample urls:",
  all.slice(0, 10).map((d) => `${d.type}:${d.status}:${String(d.fileUrl).slice(0, 40)}`)
);

await listFarmers(
  { query: { page: 1, limit: 100 } },
  {
    status() {
      return this;
    },
    json(body) {
      const withDocs = (body.items || []).filter((f) => f.documentCount);
      console.log("farmers:", body.total, "with docs:", withDocs.length);
      console.log(
        withDocs.slice(0, 5).map((f) => ({
          id: f.farmerId,
          docs: f.documentCount,
          pending: f.documentsPending,
          approved: f.documentsApproved,
          rejected: f.documentsRejected,
          kyc: f.kycStatus,
        }))
      );
      if (body.message) console.log("error:", body.message);
    },
  }
);
await mongoose.disconnect();
process.exit(0);
