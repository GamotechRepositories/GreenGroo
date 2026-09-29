import notificationRoutes from "../../legacy/routes/notificationRoutes.js";
import adminNotificationRoutes from "../../legacy/routes/adminNotificationRoutes.js";
import testFcmRoutes from "../../legacy/routes/testFcmRoutes.js";

export default [
  { path: "/api/notifications", router: notificationRoutes },
  { path: "/api/admin/notifications", router: adminNotificationRoutes },
  { path: "/api/test", router: testFcmRoutes },
];
