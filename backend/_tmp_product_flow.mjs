import "dotenv/config";
import connectDB from "./shared/db/connect.js";
import { VendorProduct, VendorProductRequest } from "./farmer-manager-service/src/models.js";
import {
  listVendorCatalogProducts,
  listVendorMyProducts,
  createVendorProductRequest,
} from "./farmer-manager-service/src/vendorProductRequestControllers.js";
import {
  listVendorProductRequestsAdmin,
  approveVendorProductRequestAdmin,
  listVendorProductsAdmin,
  removeVendorProductAdmin,
} from "./admin-ops-service/src/opsControllers.js";

const call = (fn, req) =>
  new Promise((resolve, reject) => {
    let code = 200;
    const res = { status: (c) => ((code = c), res), json: (body) => resolve({ code, body }) };
    fn({ query: {}, params: {}, body: {}, user: { vendorId: "vendor-1", id: "admin-test" }, ...req }, res, reject);
  });

await connectDB();
const vendorUser = { vendorId: "vendor-1" };
const catalog = await call(listVendorCatalogProducts, { user: vendorUser, query: { limit: 3 } });
console.log("catalog", catalog.code, "total", catalog.body.total, "categories", catalog.body.categories?.length);
const pick = catalog.body.products.find((p) => !p.added && !p.requested);
if (!pick) {
  console.log("no product available to test");
  process.exit(0);
}
console.log("picked", pick.name, pick.productId);

const created = await call(createVendorProductRequest, { user: vendorUser, body: { productId: pick.productId, notes: "test" } });
console.log("create", created.code, created.body.status);
const dup = await call(createVendorProductRequest, { user: vendorUser, body: { productId: pick.productId } });
console.log("duplicate", dup.code, dup.body.message);

const adminList = await call(listVendorProductRequestsAdmin, { query: { status: "Pending" } });
console.log("admin pending", adminList.body.stats, "has catalog", Boolean(adminList.body.data.find((r) => r.id === created.body.id)?.catalog));

const approved = await call(approveVendorProductRequestAdmin, { params: { requestId: created.body.id } });
console.log("approve", approved.code, approved.body.message);

const mine = await call(listVendorMyProducts, { user: vendorUser });
const row = mine.body.products.find((p) => p.productId === pick.productId);
console.log("vendor sees product", Boolean(row), row?.name, row?.discountedPrice, "missing", row?.catalogMissing);

const again = await call(createVendorProductRequest, { user: vendorUser, body: { productId: pick.productId } });
console.log("request again after added", again.code, again.body.message);

const adminProducts = await call(listVendorProductsAdmin, { params: { id: "vendor-1" } });
console.log("admin vendor products", adminProducts.body.data.length);
const removed = await call(removeVendorProductAdmin, { params: { id: "vendor-1", productId: pick.productId } });
console.log("remove", removed.code, removed.body.message);

await VendorProductRequest.deleteMany({ id: created.body.id });
await VendorProduct.deleteMany({ vendorId: "vendor-1", productId: pick.productId });
console.log("cleaned up");
process.exit(0);
