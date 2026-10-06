import "dotenv/config";
import connectDB from "./shared/db/connect.js";
import { VendorCrop, VendorCropRequest } from "./farmer-manager-service/src/models.js";
import {
  listVendorCatalogCrops,
  listVendorMyCrops,
  createVendorCropRequest,
} from "./farmer-manager-service/src/vendorCropRequestControllers.js";
import {
  listVendorCropRequestsAdmin,
  approveVendorCropRequestAdmin,
  rejectVendorCropRequestAdmin,
  listVendorCropsAdmin,
  removeVendorCropAdmin,
  getCollectionDashboardAdmin,
} from "./admin-ops-service/src/opsControllers.js";

const call = (fn, req) =>
  new Promise((resolve, reject) => {
    let code = 200;
    const res = { status: (c) => ((code = c), res), json: (body) => resolve({ code, body }) };
    fn({ query: {}, params: {}, body: {}, user: { vendorId: "vendor-1", id: "admin-test" }, ...req }, res, reject);
  });

await connectDB();
const vendorUser = { vendorId: "vendor-1" };
const catalog = await call(listVendorCatalogCrops, { user: vendorUser });
console.log("catalog", catalog.code, "total", catalog.body.total, catalog.body.crops.map((c) => `${c.cropName}/${c.variety}`).join(", "));
const [first, second] = catalog.body.crops.filter((c) => !c.added && !c.requested);
if (!first || !second) {
  console.log("not enough crops to test");
  process.exit(0);
}

const created = await call(createVendorCropRequest, { user: vendorUser, body: { cropId: first.cropId, notes: "test" } });
console.log("create", created.code, created.body.status);
const dup = await call(createVendorCropRequest, { user: vendorUser, body: { cropId: first.cropId } });
console.log("duplicate", dup.code, dup.body.message);
const toReject = await call(createVendorCropRequest, { user: vendorUser, body: { cropId: second.cropId } });

const adminList = await call(listVendorCropRequestsAdmin, { query: { status: "Pending" } });
console.log("admin pending", adminList.body.stats);
const dash = await call(getCollectionDashboardAdmin, {});
console.log("dashboard cropRequests", JSON.stringify(dash.body.data.cropRequests));

console.log("approve", (await call(approveVendorCropRequestAdmin, { params: { requestId: created.body.id } })).body.message);
console.log("reject no reason", (await call(rejectVendorCropRequestAdmin, { params: { requestId: toReject.body.id } })).code);
console.log("reject", (await call(rejectVendorCropRequestAdmin, { params: { requestId: toReject.body.id }, body: { remarks: "test" } })).body.message);

const mine = await call(listVendorMyCrops, { user: vendorUser });
console.log("my crops", mine.body.crops.map((c) => `${c.cropName}/${c.variety}`), "requests", mine.body.requests.map((r) => r.status));
const after = await call(listVendorCatalogCrops, { user: vendorUser });
console.log("catalog flag added", after.body.crops.find((c) => c.cropId === first.cropId)?.added);

console.log("admin vendor crops", (await call(listVendorCropsAdmin, { params: { id: "vendor-1" } })).body.data.length);
console.log("remove", (await call(removeVendorCropAdmin, { params: { id: "vendor-1", cropId: first.cropId } })).body.message);

await VendorCropRequest.deleteMany({ id: { $in: [created.body.id, toReject.body.id] } });
await VendorCrop.deleteMany({ vendorId: "vendor-1", cropId: first.cropId });
console.log("cleaned up");
process.exit(0);
