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
  getVendorAdmin,
  createDarkStoreAdmin,
  listCentreFarmersAdmin,
  listCentreFarmerManagersAdmin,
  getCollectionDashboardAdmin,
  listVendorProductRequestsAdmin,
  approveVendorProductRequestAdmin,
  rejectVendorProductRequestAdmin,
  listVendorProductsAdmin,
  removeVendorProductAdmin,
  listVendorCropRequestsAdmin,
  approveVendorCropRequestAdmin,
  rejectVendorCropRequestAdmin,
  listVendorCropsAdmin,
  removeVendorCropAdmin,
  listDarkStoreRequestsAdmin,
  approveDarkStoreRequestAdmin,
  rejectDarkStoreRequestAdmin,
  getVendorDocumentAdmin,
  deleteVendorDocumentAdmin,
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
  listSupportRoles,
  listSupportUserHistory,
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
  applyHrLeave,
  listMyHrLeaves,
  updateHrLeave,
  deleteHrLeave,
  listHrShifts,
  createHrShift,
  updateHrShift,
  deleteHrShift,
  listHrCalendar,
  listLiveHrCalendar,
  listHrVacancies,
  listOpenHrVacancies,
  createHrVacancy,
  updateHrVacancy,
  listHrCandidates,
  getHrCandidate,
  createHrCandidate,
  applyHrCandidate,
  updateHrCandidate,
  downloadHrCandidateCv,
  createHrMeeting,
  listHrMeetings,
  listMyHrMeetings,
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
import {
  adjustInventoryFarmer,
  adjustInventoryVendor,
  getInventoryFarmer,
  getInventoryVendor,
  listInventoryFarmers,
  listInventoryVendors,
} from "./inventoryHubControllers.js";
import {
  listUserMgmtZones,
  listUserMgmtStores,
  listUserMgmtStoreUsers,
} from "./userManagementControllers.js";
import {
  listAssetZones,
  listAssetStores,
  listAssetRolePeople,
  listAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} from "./assetManagementControllers.js";
import {
  listLiveRolePolicies,
  listPolicyRoles,
  listRolePolicies,
  createRolePolicy,
  updateRolePolicy,
  deleteRolePolicy,
} from "./policyControllers.js";
import {
  listGovtSchemes,
  listLiveGovtSchemes,
  getGovtScheme,
  createGovtScheme,
  updateGovtScheme,
  deleteGovtScheme,
  applyGovtScheme,
  listMyGovtSchemeApplications,
  listAllGovtSchemeApplications,
  updateGovtSchemeApplicationStatus,
  deleteGovtSchemeApplication,
} from "./govtSchemeControllers.js";
import {
  listMarketPrices,
  listLiveMarketPrices,
  getMarketPrice,
  createMarketPrice,
  updateMarketPrice,
  deleteMarketPrice,
} from "./marketPriceControllers.js";
import { requireVendor } from "../../farmer-manager-service/src/middleware.js";
import { attachVendorHrScope } from "./hrScope.js";

const router = express.Router();

router.post("/gift-cards/validate", optionalAuth, validateGiftCardPublic);
router.get("/pricing/active", listActivePricingPublic);
router.get("/hr/announcements/live", optionalAuth, listLiveHrAnnouncements);
router.get("/hr/calendar/live", optionalAuth, listLiveHrCalendar);
router.post("/hr/leaves/apply", protect, applyHrLeave);
router.get("/hr/leaves/mine", protect, listMyHrLeaves);
router.get("/hr/vacancies/open", listOpenHrVacancies);
router.post("/hr/candidates/apply", applyHrCandidate);
router.get("/policies/live", optionalAuth, listLiveRolePolicies);
router.get("/govt-schemes/live", optionalAuth, listLiveGovtSchemes);
router.post("/govt-schemes/apply", optionalAuth, applyGovtScheme);
router.get("/govt-schemes/applications/mine", optionalAuth, listMyGovtSchemeApplications);
router.get("/market-prices/live", optionalAuth, listLiveMarketPrices);
router.get("/hr/meetings/mine", protect, listMyHrMeetings);

router.use(protect, requireAdmin);

router.get("/gift-cards", listGiftCards);
router.post("/gift-cards", createGiftCard);
router.put("/gift-cards/:id", updateGiftCard);
router.delete("/gift-cards/:id", deleteGiftCard);

router.get("/govt-schemes", listGovtSchemes);
router.get("/govt-schemes/applications", listAllGovtSchemeApplications);
router.put("/govt-schemes/applications/:id/status", updateGovtSchemeApplicationStatus);
router.delete("/govt-schemes/applications/:id", deleteGovtSchemeApplication);
router.get("/govt-schemes/:id", getGovtScheme);
router.post("/govt-schemes", createGovtScheme);
router.put("/govt-schemes/:id", updateGovtScheme);
router.delete("/govt-schemes/:id", deleteGovtScheme);

router.get("/market-prices", listMarketPrices);
router.get("/market-prices/:id", getMarketPrice);
router.post("/market-prices", createMarketPrice);
router.put("/market-prices/:id", updateMarketPrice);
router.delete("/market-prices/:id", deleteMarketPrice);

router.get("/policies/roles", listPolicyRoles);
router.get("/policies", listRolePolicies);
router.post("/policies", createRolePolicy);
router.put("/policies/:id", updateRolePolicy);
router.delete("/policies/:id", deleteRolePolicy);

router.get("/support/roles", listSupportRoles);
router.get("/support/history", listSupportUserHistory);
router.get("/support", listStoreSupport);
router.patch("/support/:id", updateStoreSupport);

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
router.get("/vendors/:id", getVendorAdmin);
router.put("/vendors/:id", updateVendorAdmin);
router.delete("/vendors/:id", deleteVendorAdmin);
router.get("/vendors/:id/documents/:docId", getVendorDocumentAdmin);
router.delete("/vendors/:id/documents/:docId", deleteVendorDocumentAdmin);
router.post("/dark-stores", createDarkStoreAdmin);
router.get("/collection-dashboard", getCollectionDashboardAdmin);
router.get("/vendor-product-requests", listVendorProductRequestsAdmin);
router.post("/vendor-product-requests/:requestId/approve", approveVendorProductRequestAdmin);
router.post("/vendor-product-requests/:requestId/reject", rejectVendorProductRequestAdmin);
router.get("/vendors/:id/products", listVendorProductsAdmin);
router.delete("/vendors/:id/products/:productId", removeVendorProductAdmin);
router.get("/vendor-crop-requests", listVendorCropRequestsAdmin);
router.post("/vendor-crop-requests/:requestId/approve", approveVendorCropRequestAdmin);
router.post("/vendor-crop-requests/:requestId/reject", rejectVendorCropRequestAdmin);
router.get("/vendors/:id/crops", listVendorCropsAdmin);
router.delete("/vendors/:id/crops/:cropId", removeVendorCropAdmin);
router.get("/collection-farmers", listCentreFarmersAdmin);
router.get("/collection-farmer-managers", listCentreFarmerManagersAdmin);
router.get("/dark-store-requests", listDarkStoreRequestsAdmin);
router.post("/dark-store-requests/:requestId/approve", approveDarkStoreRequestAdmin);
router.post("/dark-store-requests/:requestId/reject", rejectDarkStoreRequestAdmin);

router.get("/inventory/farmers", listInventoryFarmers);
router.get("/inventory/farmers/:farmerId", getInventoryFarmer);
router.post("/inventory/farmers/:farmerId/adjust", adjustInventoryFarmer);
router.get("/inventory/vendors", listInventoryVendors);
router.get("/inventory/vendors/:vendorId", getInventoryVendor);
router.post("/inventory/vendors/:vendorId/adjust", adjustInventoryVendor);

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
router.get("/hr/meetings", listHrMeetings);
router.post("/hr/meetings", createHrMeeting);
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
router.get("/hr/candidates/:id", getHrCandidate);
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

router.get("/finance", listFinance);
router.post("/finance", createFinanceEntry);
router.put("/finance/:id", updateFinanceEntry);
router.delete("/finance/:id", deleteFinanceEntry);

router.get("/refunds", listRefunds);
router.post("/refunds", createRefund);
router.put("/refunds/:id", updateRefund);

router.get("/reports", getReports);

router.get("/user-management/zones", listUserMgmtZones);
router.get("/user-management/zones/:zoneKey/stores", listUserMgmtStores);
router.get("/user-management/stores/:storeId/users", listUserMgmtStoreUsers);

router.get("/assets-management/zones", listAssetZones);
router.get("/assets-management/zones/:zoneKey/stores", listAssetStores);
router.get("/assets-management/stores/:storeId/people", listAssetRolePeople);
router.get("/assets-management/stores/:storeId/assets", listAssets);
router.post("/assets-management/stores/:storeId/assets", createAsset);
router.put("/assets-management/assets/:id", updateAsset);
router.delete("/assets-management/assets/:id", deleteAsset);

/** Vendor (collection centre) HR: same controllers, limited to the vendor's farmer managers and pickup drivers. */
const vendorHrRouter = express.Router();
vendorHrRouter.use(requireVendor, attachVendorHrScope);

vendorHrRouter.get("/hr", listHrDirectory);
vendorHrRouter.post("/hr", createHrStaff);
vendorHrRouter.post("/hr/employment", upsertHrEmployment);
vendorHrRouter.get("/hr/roles", listHrRoles);
vendorHrRouter.get("/hr/people/:type/:id", getHrPerson);
vendorHrRouter.get("/hr/calendar", listHrCalendar);
vendorHrRouter.get("/hr/announcements", listHrAnnouncements);
vendorHrRouter.post("/hr/announcements", createHrAnnouncement);
vendorHrRouter.put("/hr/announcements/:id", updateHrAnnouncement);
vendorHrRouter.delete("/hr/announcements/:id", deleteHrAnnouncement);
vendorHrRouter.get("/hr/meetings", listHrMeetings);
vendorHrRouter.post("/hr/meetings", createHrMeeting);
vendorHrRouter.get("/hr/leave-policies", listHrLeavePolicies);
vendorHrRouter.put("/hr/leave-policies/:roleKey", upsertHrLeavePolicy);
vendorHrRouter.get("/hr/leaves", listHrLeaves);
vendorHrRouter.post("/hr/leaves", createHrLeave);
vendorHrRouter.put("/hr/leaves/:id", updateHrLeave);
vendorHrRouter.delete("/hr/leaves/:id", deleteHrLeave);
vendorHrRouter.get("/hr/shifts", listHrShifts);
vendorHrRouter.post("/hr/shifts", createHrShift);
vendorHrRouter.put("/hr/shifts/:id", updateHrShift);
vendorHrRouter.delete("/hr/shifts/:id", deleteHrShift);
vendorHrRouter.get("/hr/vacancies", listHrVacancies);
vendorHrRouter.post("/hr/vacancies", createHrVacancy);
vendorHrRouter.put("/hr/vacancies/:id", updateHrVacancy);
vendorHrRouter.get("/hr/candidates", listHrCandidates);
vendorHrRouter.post("/hr/candidates", createHrCandidate);
vendorHrRouter.get("/hr/candidates/:id", getHrCandidate);
vendorHrRouter.put("/hr/candidates/:id", updateHrCandidate);
vendorHrRouter.get("/hr/candidates/:id/cv", downloadHrCandidateCv);
vendorHrRouter.get("/hr/attendance", listHrAttendance);
vendorHrRouter.post("/hr/attendance", clockHrAttendance);
vendorHrRouter.get("/hr/tasks", listHrTasks);
vendorHrRouter.post("/hr/tasks", createHrTask);
vendorHrRouter.put("/hr/tasks/:id", updateHrTask);
vendorHrRouter.get("/hr/payroll", listHrPayroll);
vendorHrRouter.post("/hr/payroll/run", runHrPayroll);
vendorHrRouter.put("/hr/payroll/:id", updateHrPayroll);
vendorHrRouter.put("/hr/:id", updateHrStaff);

export default [
  { path: "/api/admin-ops", router },
  { path: "/api/vendor/hr-ops", router: vendorHrRouter },
];
