import webhookRoutes from "./routes/webhookRoutes.js";
import shipmentRoutes from "./routes/shipmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";

export default [
  { path: "/api/delivery-boys", router: authRoutes },
  { path: "/api/webhooks", router: webhookRoutes },
  { path: "/api/shipments", router: shipmentRoutes },
];
