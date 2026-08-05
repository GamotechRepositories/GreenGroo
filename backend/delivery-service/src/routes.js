import webhookRoutes from "./routes/webhookRoutes.js";
import shipmentRoutes from "./routes/shipmentRoutes.js";

export default [
  { path: "/api/webhooks", router: webhookRoutes },
  { path: "/api/shipments", router: shipmentRoutes },
];
