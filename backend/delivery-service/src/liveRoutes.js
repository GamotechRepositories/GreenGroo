import express from "express";
import { protect } from "@greengrocc/shared";
import { requireDeliveryManager } from "./delivery-manager/middleware/requireDeliveryManager.js";
import { updateStatus } from "./delivery-app/controllers/authController.js";
import {
  bookShift,
  getShiftBooking,
  getManagerShiftsByDate,
  listShifts,
} from "./delivery-app/controllers/shiftController.js";
import {
  getLoginHours,
  getLiveRiders,
} from "./delivery-app/controllers/gigController.js";
import {
  getPeakHours,
  manualAssignOrder,
  setPeakHours,
  updateRiderDocumentStatus,
} from "./delivery-manager/controllers/liveOpsController.js";

const riderRouter = express.Router();
riderRouter.post("/status", protect, updateStatus);
riderRouter.post("/shift-booking", protect, bookShift);
riderRouter.get("/shift-booking/:riderId", protect, getShiftBooking);
riderRouter.get("/login-hours", protect, getLoginHours);

const managerRouter = express.Router();
managerRouter.use(protect, requireDeliveryManager);
managerRouter.post("/rider/:riderId/document-status", updateRiderDocumentStatus);
managerRouter.post("/order/assign", manualAssignOrder);
managerRouter.post("/peak-hours", setPeakHours);
managerRouter.get("/shifts", getManagerShiftsByDate);
managerRouter.get("/riders/live", getLiveRiders);

const shiftsRouter = express.Router();
shiftsRouter.get("/", listShifts);

const peakRouter = express.Router();
peakRouter.get("/", getPeakHours);

export default [
  { path: "/api/shifts", router: shiftsRouter },
  { path: "/api/peak-hours", router: peakRouter },
  { path: "/api/rider", router: riderRouter },
  { path: "/api/manager", router: managerRouter },
];
