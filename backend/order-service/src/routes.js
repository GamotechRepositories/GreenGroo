import orderRoutes from "./routes/orderRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";

export default [
  { path: "/api/orders", router: orderRoutes },
  { path: "/api/admin/orders", router: adminOrderRoutes },
];
