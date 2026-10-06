import orderRoutes from "../../legacy/routes/orderRoutes.js";
import orderTrackingRoutes from "../../delivery-service/src/routes/orderTracking.routes.js";

export default [
  { path: "/api/orders", router: orderTrackingRoutes },
  { path: "/api/orders", router: orderRoutes },
];
