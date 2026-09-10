import express from "express";
import { protect, requireAdmin, optionalAuth } from "@greengrocc/shared";
import {
  listGiftCards,
  createGiftCard,
  updateGiftCard,
  deleteGiftCard,
  validateGiftCardPublic,
  listPricingRules,
  listActivePricingPublic,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  listBulkDeals,
  createBulkDeal,
  updateBulkDeal,
  deleteBulkDeal,
  exportProductsCsv,
  exportProductsJson,
  importProductsCsv,
  importProductsJson,
  listProductsLite,
} from "./catalogControllers.js";
import {
  listVendorsAdmin,
  createVendorAdmin,
  updateVendorAdmin,
  deleteVendorAdmin,
  listHrDirectory,
  createHrStaff,
  updateHrStaff,
  clockHrAttendance,
  listHrAttendance,
  upsertHrEmployment,
  listHrTasks,
  createHrTask,
  updateHrTask,
  listHrPayroll,
  runHrPayroll,
  updateHrPayroll,
  listDeliveryOrders,
  assignDeliveryOrder,
  updateDeliveryOrderStatus,
  listRidersLite,
  listDeliveryTracking,
  listDeliveryTeam,
  getDeliveryManagerAdmin,
  getDeliveryBoyAdmin,
  listStoreSupport,
  updateStoreSupport,
} from "./opsControllers.js";
import {
  getHrPerson,
  listHrRoles,
  listHrAnnouncements,
  listLiveHrAnnouncements,
  createHrAnnouncement,
  updateHrAnnouncement,
  deleteHrAnnouncement,
  listHrLeavePolicies,
  upsertHrLeavePolicy,
  listHrLeaves,
  createHrLeave,
  updateHrLeave,
  deleteHrLeave,
  listHrShifts,
  createHrShift,
  updateHrShift,
  deleteHrShift,
  listHrCalendar,
  listHrVacancies,
  createHrVacancy,
  updateHrVacancy,
  listHrCandidates,
  createHrCandidate,
  updateHrCandidate,
  downloadHrCandidateCv,
} from "./hrExtendedControllers.js";
import {
  listFinance,
  createFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry,
  listRefunds,
  createRefund,
  updateRefund,
  getReports,
} from "./financeControllers.js";

const router = express.Router();

router.post("/gift-cards/validate", optionalAuth, validateGiftCardPublic);
router.get("/pricing/active", listActivePricingPublic);
router.get("/hr/announcements/live", optionalAuth, listLiveHrAnnouncements);

router.use(protect, requireAdmin);

router.get("/gift-cards", listGiftCards);
router.post("/gift-cards", createGiftCard);
router.put("/gift-cards/:id", updateGiftCard);
router.delete("/gift-cards/:id", deleteGiftCard);

router.get("/pricing", listPricingRules);
router.post("/pricing", createPricingRule);
router.put("/pricing/:id", updatePricingRule);
router.delete("/pricing/:id", deletePricingRule);

router.get("/bulk-selling", listBulkDeals);
router.post("/bulk-selling", createBulkDeal);
router.put("/bulk-selling/:id", updateBulkDeal);
router.delete("/bulk-selling/:id", deleteBulkDeal);

router.get("/products/lite", listProductsLite);
router.get("/csv/products", exportProductsCsv);
router.post("/csv/products", importProductsCsv);
router.get("/bulk/products", exportProductsJson);
router.post("/bulk/products", importProductsJson);

router.get("/vendors", listVendorsAdmin);
router.post("/vendors", createVendorAdmin);
router.put("/vendors/:id", updateVendorAdmin);
router.delete("/vendors/:id", deleteVendorAdmin);

router.get("/hr", listHrDirectory);
router.post("/hr", createHrStaff);
router.post("/hr/employment", upsertHrEmployment);
router.get("/hr/roles", listHrRoles);
router.get("/hr/people/:type/:id", getHrPerson);
router.get("/hr/calendar", listHrCalendar);
router.get("/hr/announcements", listHrAnnouncements);
router.post("/hr/announcements", createHrAnnouncement);
router.put("/hr/announcements/:id", updateHrAnnouncement);
router.delete("/hr/announcements/:id", deleteHrAnnouncement);
router.get("/hr/leave-policies", listHrLeavePolicies);
router.put("/hr/leave-policies/:roleKey", upsertHrLeavePolicy);
router.get("/hr/leaves", listHrLeaves);
router.post("/hr/leaves", createHrLeave);
router.put("/hr/leaves/:id", updateHrLeave);
router.delete("/hr/leaves/:id", deleteHrLeave);
router.get("/hr/shifts", listHrShifts);
router.post("/hr/shifts", createHrShift);
router.put("/hr/shifts/:id", updateHrShift);
router.delete("/hr/shifts/:id", deleteHrShift);
router.get("/hr/vacancies", listHrVacancies);
router.post("/hr/vacancies", createHrVacancy);
router.put("/hr/vacancies/:id", updateHrVacancy);
router.get("/hr/candidates", listHrCandidates);
router.post("/hr/candidates", createHrCandidate);
router.put("/hr/candidates/:id", updateHrCandidate);
router.get("/hr/candidates/:id/cv", downloadHrCandidateCv);
router.get("/hr/attendance", listHrAttendance);
router.post("/hr/attendance", clockHrAttendance);
router.get("/hr/tasks", listHrTasks);
router.post("/hr/tasks", createHrTask);
router.put("/hr/tasks/:id", updateHrTask);
router.get("/hr/payroll", listHrPayroll);
router.post("/hr/payroll/run", runHrPayroll);
router.put("/hr/payroll/:id", updateHrPayroll);
router.put("/hr/:id", updateHrStaff);

router.get("/delivery/orders", listDeliveryOrders);
router.get("/delivery/riders", listRidersLite);
router.get("/delivery/team", listDeliveryTeam);
router.get("/delivery/managers/:id", getDeliveryManagerAdmin);
router.get("/delivery/boys/:id", getDeliveryBoyAdmin);
router.patch("/delivery/orders/:id/assign", assignDeliveryOrder);
router.patch("/delivery/orders/:id/status", updateDeliveryOrderStatus);
router.get("/tracking", listDeliveryTracking);

router.get("/support", listStoreSupport);
router.patch("/support/:id", updateStoreSupport);

router.get("/finance", listFinance);
router.post("/finance", createFinanceEntry);
router.put("/finance/:id", updateFinanceEntry);
router.delete("/finance/:id", deleteFinanceEntry);

router.get("/refunds", listRefunds);
router.post("/refunds", createRefund);
router.put("/refunds/:id", updateRefund);

router.get("/reports", getReports);

export default [{ path: "/api/admin-ops", router }];
