import authRoutes from "./delivery-app/routes/authRoutes.js";
import shipmentRoutes from "./delivery-app/routes/shipmentRoutes.js";
import webhookRoutes from "./delivery-app/routes/webhookRoutes.js";
import managerRoutes from "./delivery-manager/routes/managerRoutes.js";
import liveRoutes from "./liveRoutes.js";

export default [
  { path: "/api/delivery-boys", router: authRoutes },
  { path: "/api/delivery-managers", router: managerRoutes },
  { path: "/api/webhooks", router: webhookRoutes },
  { path: "/api/shipments", router: shipmentRoutes },
  ...liveRoutes,
];
