import express from "express";
import { protect } from "@greengrocc/shared";
import { requireDeliveryManager } from "../middleware/requireDeliveryManager.js";
import { login, me } from "../controllers/managerAuthController.js";
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
import {
  getLiveRiders,
} from "../../delivery-app/controllers/gigController.js";
import {
  getManagerShiftsByDate,
} from "../../delivery-app/controllers/shiftController.js";
import {
  setPeakHours,
  updateRiderDocumentStatus,
  manualAssignOrder,
} from "../controllers/liveOpsController.js";
import { createDeliveryBoyByManager } from "../controllers/createRiderController.js";

const router = express.Router();

// Public self-register disabled — product managers create accounts via /api/staff
router.post("/register", (_req, res) => {
  res.status(403).json({
    success: false,
    message:
      "Self-registration is disabled. Ask a Product Manager to create your account.",
  });
});
router.post("/login", login);

router.use(protect, requireDeliveryManager);

router.get("/me", me);
router.get("/dashboard", getDashboardSummary);
router.get("/orders", listIncomingOrders);
router.get("/inventory", listInventory);
router.get("/riders", listRiders);
router.get("/riders/pending", listPendingDrivers);
router.post("/riders", createDeliveryBoyByManager);
router.post("/riders/:riderId/verify", verifyDriver);
router.post("/orders/:orderId/inform-customer", informCustomer);
router.post("/orders/:orderId/assign", assignOrder);
router.patch("/orders/:orderId/delivered", markDelivered);
router.get("/shifts", getManagerShiftsByDate);
router.get("/riders/live", getLiveRiders);
router.post("/peak-hours", setPeakHours);
router.post("/riders/:riderId/document-status", updateRiderDocumentStatus);
router.post("/order/assign", manualAssignOrder);

export default router;
