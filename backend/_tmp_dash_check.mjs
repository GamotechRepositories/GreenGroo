import "dotenv/config";
import connectDB from "./shared/db/connect.js";
import {
  getCollectionDashboardAdmin,
  listCentreFarmersAdmin,
  listCentreFarmerManagersAdmin,
} from "./admin-ops-service/src/opsControllers.js";

const call = (fn, query = {}) =>
  new Promise((resolve, reject) => {
    const res = { status: () => res, json: resolve };
    fn({ query }, res, reject);
  });

await connectDB();
const dash = await call(getCollectionDashboardAdmin);
const { centreRows, recentRequests, ...summary } = dash.data;
console.log(JSON.stringify(summary, null, 1));
console.log("centreRows", centreRows.length, JSON.stringify(centreRows.slice(0, 2)));
const farmers = await call(listCentreFarmersAdmin, { limit: 2 });
console.log("farmers total", farmers.total, JSON.stringify(farmers.data[0] || null));
const managers = await call(listCentreFarmerManagersAdmin);
console.log("managers total", managers.total, JSON.stringify(managers.data[0] || null));
process.exit(0);
