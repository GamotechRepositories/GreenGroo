import mongoose from "mongoose";
import { withErpBase, uniqueIndex } from "./plugins.js";
import { CRM_ACTIVITY_TYPES, ERP_ROLES } from "../config/idRegistry.js";

const { Schema } = mongoose;

const employeeSchema = new Schema(
  withErpBase({
    employeeId: { type: String, required: true },
    department: { type: String, default: "OPS", index: true },
    employeeName: { type: String, required: true },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    designation: { type: String, default: "" },
    joiningDate: { type: String, default: "" },
    attendanceStatus: { type: String, default: "" },
    leaveBalance: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },
    employmentStatus: { type: String, default: "ACTIVE" },
    salaryStatus: { type: String, default: "PENDING" },
  }),
  { timestamps: true, collection: "employees" }
);
uniqueIndex(employeeSchema, "employeeId");

const recruitmentSchema = new Schema(
  withErpBase({
    recruitmentId: { type: String, required: true },
    candidateName: { type: String, required: true },
    position: { type: String, default: "" },
    source: { type: String, default: "" },
    interviewStatus: { type: String, default: "PENDING" },
    selectionStatus: { type: String, default: "PENDING" },
    documents: [{ type: String }],
    offerStatus: { type: String, default: "PENDING" },
    joiningStatus: { type: String, default: "PENDING" },
  }),
  { timestamps: true, collection: "recruitments" }
);
uniqueIndex(recruitmentSchema, "recruitmentId");

const attendanceSchema = new Schema(
  withErpBase({
    attendanceId: { type: String, required: true },
    employeeId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    present: { type: Boolean, default: false },
    absent: { type: Boolean, default: false },
    late: { type: Boolean, default: false },
    halfDay: { type: Boolean, default: false },
    workingHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
  }),
  { timestamps: true, collection: "attendance" }
);
uniqueIndex(attendanceSchema, "attendanceId");
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const customerSchema = new Schema(
  withErpBase({
    customerId: { type: String, required: true },
    customerType: { type: String, default: "RETAIL" },
    name: { type: String, required: true },
    mobile: { type: String, default: "", index: true },
    email: { type: String, default: "" },
    city: { type: String, default: "", index: true },
    address: { type: String, default: "" },
    totalOrders: { type: Number, default: 0 },
    totalPurchase: { type: Number, default: 0 },
    orderFrequency: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    complaints: { type: Number, default: 0 },
    loyaltyScore: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 },
    sourceUserId: { type: String, default: "" },
  }),
  { timestamps: true, collection: "customers" }
);
uniqueIndex(customerSchema, "customerId");

const crmActivitySchema = new Schema(
  withErpBase({
    crmActivityId: { type: String, required: true },
    customerId: { type: String, required: true, index: true },
    activityType: { type: String, enum: CRM_ACTIVITY_TYPES, required: true },
    activityDate: { type: String, default: "" },
    notes: { type: String, default: "" },
    outcome: { type: String, default: "" },
    nextFollowUpDate: { type: String, default: "" },
    conversionStatus: { type: String, default: "OPEN" },
    createdBy: { type: String, default: "" },
  }),
  { timestamps: true, collection: "crm_activities" }
);
uniqueIndex(crmActivitySchema, "crmActivityId");

const userLoginSchema = new Schema(
  withErpBase({
    userLoginId: { type: String, required: true },
    userId: { type: String, default: "", index: true },
    role: { type: String, enum: ERP_ROLES, required: true, index: true },
    email: { type: String, default: "", index: true },
    mobile: { type: String, default: "" },
    passwordHash: { type: String, default: "", select: false },
    lastLogin: { type: Date, default: null },
  }),
  { timestamps: true, collection: "user_logins" }
);
uniqueIndex(userLoginSchema, "userLoginId");

export const Employee = mongoose.models.ErpEmployee || mongoose.model("ErpEmployee", employeeSchema);
export const Recruitment = mongoose.models.ErpRecruitment || mongoose.model("ErpRecruitment", recruitmentSchema);
export const Attendance = mongoose.models.ErpAttendance || mongoose.model("ErpAttendance", attendanceSchema);
export const Customer = mongoose.models.ErpCustomer || mongoose.model("ErpCustomer", customerSchema);
export const CrmActivity = mongoose.models.ErpCrmActivity || mongoose.model("ErpCrmActivity", crmActivitySchema);
export const UserLogin = mongoose.models.ErpUserLogin || mongoose.model("ErpUserLogin", userLoginSchema);
