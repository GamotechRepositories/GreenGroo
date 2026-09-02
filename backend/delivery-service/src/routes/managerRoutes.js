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
  getDriverDetails,
  toggleRiderActive,
  packOrder,
  createDemoStoreOrder,
} from "../controllers/managerDashboardController.js";
import {
  getManagerOrderPickupQr,
  verifyPickupByManager,
  approvePickupProofByManager,
} from "../controllers/riderOrderController.js";
import {
  createInventoryRequest,
  listMyInventoryRequests,
} from "../controllers/inventoryRequestController.js";
import {
  getLiveRiders,
} from "../controllers/gigController.js";
import {
  setPeakHours,
  updateRiderDocumentStatus,
  manualAssignOrder,
} from "../controllers/liveOpsController.js";
import { createDeliveryBoyByManager } from "../controllers/createRiderController.js";

import {
  createShift,
  listShifts,
  listManagerSlots,
  updateSlotDateWise,
  deleteSlotDateWise,
  getSlotDetailsWithRiders,
} from "../controllers/shiftManagementController.js";

import {
  createGig,
  listGigs,
  updateGig,
  deleteGig,
} from "../controllers/gigManagementController.js";

const router = express.Router();

// Public self-register enabled for delivery managers
router.post("/register", register);
router.post("/login", login);

router.use(protect, requireDeliveryManager);

router.get("/me", me);
router.get("/dashboard", getDashboardSummary);
router.get("/orders", listIncomingOrders);
router.get("/inventory", listInventory);
router.get("/inventory-requests", listMyInventoryRequests);
router.post("/inventory-requests", createInventoryRequest);
router.get("/riders", listRiders);
router.get("/drivers", listRiders);
router.get("/riders/pending", listPendingDrivers);
router.get("/riders/live", getLiveRiders);
router.get("/drivers/:driverId", getDriverDetails);
router.get("/riders/:driverId", getDriverDetails);
router.post("/drivers/:driverId/toggle-active", toggleRiderActive);
router.post("/riders", createDeliveryBoyByManager);
router.post("/riders/:riderId/verify", verifyDriver);
router.post("/orders/:orderId/inform-customer", informCustomer);
router.post("/orders/:orderId/pack", packOrder);
router.get("/orders/:orderId/pickup-qr", getManagerOrderPickupQr);
router.post("/orders/:orderId/verify-pickup", verifyPickupByManager);
router.post("/orders/:orderId/approve-pickup-proof", approvePickupProofByManager);
router.post("/orders/demo", createDemoStoreOrder);
router.post("/orders/:orderId/assign", assignOrder);
router.patch("/orders/:orderId/delivered", markDelivered);

// Shift & Slot Management APIs
router.post("/shifts", createShift);
router.get("/shifts", listShifts);
router.get("/shifts/slots", listManagerSlots);
router.put("/shifts/slots/:slotId", updateSlotDateWise);
router.delete("/shifts/slots/:slotId", deleteSlotDateWise);
router.get("/shifts/slots/:slotId/details", getSlotDetailsWithRiders);

// Gig & Incentive Management APIs
router.post("/gigs", createGig);
router.get("/gigs", listGigs);
router.put("/gigs/:gigId", updateGig);
router.delete("/gigs/:gigId", deleteGig);

router.post("/peak-hours", setPeakHours);
router.post("/riders/:riderId/document-status", updateRiderDocumentStatus);
router.post("/order/assign", manualAssignOrder);

export default router;
