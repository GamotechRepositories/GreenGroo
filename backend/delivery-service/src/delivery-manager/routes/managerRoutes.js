import express from "express";
import { protect } from "@greengrocc/shared";
import { requireDeliveryManager } from "../middleware/requireDeliveryManager.js";
import { login, me, register } from "../controllers/managerAuthController.js";
import {
  assignOrder,
  getDashboardSummary,
  informCustomer,
  listIncomingOrders,
  listInventory,
  listPendingDrivers,
  listRiders,
  markDelivered,
  verifyDriver,
} from "../controllers/managerDashboardController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.use(protect, requireDeliveryManager);

router.get("/me", me);
router.get("/dashboard", getDashboardSummary);
router.get("/orders", listIncomingOrders);
router.get("/inventory", listInventory);
router.get("/riders", listRiders);
router.get("/riders/pending", listPendingDrivers);
router.post("/riders/:riderId/verify", verifyDriver);
router.post("/orders/:orderId/inform-customer", informCustomer);
router.post("/orders/:orderId/assign", assignOrder);
router.patch("/orders/:orderId/delivered", markDelivered);

export default router;
