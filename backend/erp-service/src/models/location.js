import mongoose from "mongoose";
import { withErpBase, uniqueIndex } from "./plugins.js";

const { Schema } = mongoose;

const companySchema = new Schema(
  withErpBase({
    companyId: { type: String, required: true, unique: true, default: "GGC" },
    companyName: { type: String, required: true, default: "GreenGrocc" },
    legalName: { type: String, default: "GreenGrocc" },
    gstNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
  }),
  { timestamps: true, collection: "companies" }
);

const stateSchema = new Schema(
  withErpBase({
    stateId: { type: String, required: true },
    stateCode: { type: String, required: true },
    stateName: { type: String, required: true },
    countryId: { type: String, default: "IN" },
  }),
  { timestamps: true, collection: "states" }
);
uniqueIndex(stateSchema, "stateId");
stateSchema.index({ stateCode: 1 }, { unique: true });

const districtSchema = new Schema(
  withErpBase({
    districtId: { type: String, required: true },
    stateId: { type: String, required: true, index: true },
    districtCode: { type: String, required: true },
    districtName: { type: String, required: true },
  }),
  { timestamps: true, collection: "districts" }
);
uniqueIndex(districtSchema, "districtId");
districtSchema.index({ stateId: 1, districtCode: 1 }, { unique: true });

const talukaSchema = new Schema(
  withErpBase({
    talukaId: { type: String, required: true },
    stateId: { type: String, required: true, index: true },
    districtId: { type: String, required: true, index: true },
    talukaCode: { type: String, required: true },
    talukaName: { type: String, required: true },
  }),
  { timestamps: true, collection: "talukas" }
);
uniqueIndex(talukaSchema, "talukaId");
talukaSchema.index({ districtId: 1, talukaCode: 1 }, { unique: true });

const villageSchema = new Schema(
  withErpBase({
    villageId: { type: String, required: true },
    stateId: { type: String, required: true, index: true },
    districtId: { type: String, required: true, index: true },
    talukaId: { type: String, required: true, index: true },
    villageCode: { type: String, required: true },
    villageName: { type: String, required: true },
  }),
  { timestamps: true, collection: "villages" }
);
uniqueIndex(villageSchema, "villageId");
villageSchema.index({ talukaId: 1, villageCode: 1 }, { unique: true });

export const Company = mongoose.models.ErpCompany || mongoose.model("ErpCompany", companySchema);
export const State = mongoose.models.ErpState || mongoose.model("ErpState", stateSchema);
export const District = mongoose.models.ErpDistrict || mongoose.model("ErpDistrict", districtSchema);
export const Taluka = mongoose.models.ErpTaluka || mongoose.model("ErpTaluka", talukaSchema);
export const Village = mongoose.models.ErpVillage || mongoose.model("ErpVillage", villageSchema);
