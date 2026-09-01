import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { connectDB, errorHandler, notFound } from "@greengrocc/shared";
import { initSocket } from "./shared/socket.js";
// Ensure User model is registered for admin JWT role resolution
import "./legacy/models/user.js";

import authRoutes from "./auth-service/src/routes.js";
import userRoutes from "./user-service/src/routes.js";
import productRoutes from "./product-service/src/routes.js";
import inventoryRoutes from "./inventory-service/src/routes.js";
import orderRoutes from "./order-service/src/routes.js";
import paymentRoutes from "./payment-service/src/routes.js";
import deliveryRoutes from "./delivery-service/src/routes.js";
import notificationRoutes from "./notification-service/src/routes.js";
import staffRoutes from "./staff-service/src/routes.js";
import farmerManagerRoutes from "./farmer-manager-service/src/routes.js";
import erpRoutes from "./erp-service/src/routes.js";
import { seedInitialData } from "./farmer-manager-service/src/controllers.js";
import { seedErpMasters } from "./erp-service/src/seed.js";
import { seedDefaultSectionsIfEmpty } from "./product-service/src/controllers/sectionController.js";
import { seedDefaultCategoriesIfEmpty } from "./product-service/src/controllers/categoryController.js";
import { seedDefaultCouponsIfEmpty } from "./legacy/controllers/couponController.js";
import { seedDefaultAdminIfEmpty } from "./legacy/controllers/userController.js";
import rewardRoutes from "./legacy/routes/rewardRoutes.js";
import { seedDefaultRewardSettingsIfEmpty } from "./legacy/controllers/rewardController.js";
import { initIncentiveCron } from "./delivery-service/src/services/incentiveCronService.js";
import adminDarkStoreRoutes from "./delivery-service/src/routes/adminDarkStoreRoutes.js";
import storeCatalogRoutes from "./delivery-service/src/routes/storeCatalogRoutes.js";
import adminOpsRoutes from "./admin-ops-service/src/routes.js";
import { seedDefaultPricingRule } from "./admin-ops-service/src/pricingAttach.js";

const PORT = process.env.PORT || 5001;

const allRoutes = [
  ...authRoutes,
  ...userRoutes,
  ...productRoutes,
  ...inventoryRoutes,
  ...orderRoutes,
  ...paymentRoutes,
  ...deliveryRoutes,
  ...notificationRoutes,
  ...staffRoutes,
  ...farmerManagerRoutes,
  ...erpRoutes,
  ...adminOpsRoutes,
];

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Dynamically allow any localhost or 127.0.0.1 dev server port
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
        : [];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "GreenGrocc API is running" });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    services: [
      "auth",
      "user",
      "product",
      "inventory",
      "order",
      "payment",
      "delivery",
      "notification",
      "staff",
      "farmer-manager",
      "erp",
      "admin-ops",
    ],
  });
});

for (const { path, router } of allRoutes) {
  app.use(path, router);
}

app.use("/api/admin/dark-stores", adminDarkStoreRoutes);
app.use("/api/stores", storeCatalogRoutes);
app.use("/api/rewards", rewardRoutes);

app.use(notFound);
app.use(errorHandler);

if (!process.env.JWT_SECRET) {
  console.warn(
    "Warning: JWT_SECRET is not set in .env — signup and login will fail until you add it."
  );
}

connectDB("server").then(async () => {
  await seedInitialData();
  await seedErpMasters();
  await seedDefaultAdminIfEmpty();
  await seedDefaultSectionsIfEmpty();
  await seedDefaultCategoriesIfEmpty();
  await seedDefaultCouponsIfEmpty();
  await seedDefaultRewardSettingsIfEmpty();
  await seedDefaultPricingRule();
  initIncentiveCron();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`GreenGrocc backend running on port ${PORT}`);
    console.log(`Socket.io live on port ${PORT}`);
  });
});

export default app;
