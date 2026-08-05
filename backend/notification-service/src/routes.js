import notificationRoutes from "./routes/notificationRoutes.js";
import adminNotificationRoutes from "./routes/adminNotificationRoutes.js";
import testFcmRoutes from "./routes/testFcmRoutes.js";

export default [
  { path: "/api/notifications", router: notificationRoutes },
  { path: "/api/admin/notifications", router: adminNotificationRoutes },
  { path: "/api/test", router: testFcmRoutes },
];
