import { State, District, Taluka, Village } from "../models/location.js";
import { generateId } from "./idGenerator.js";

function norm(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function codeFromName(name, width = 3) {
  return String(name)
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, width)
    .toUpperCase()
    .padEnd(Math.min(width, 2), "X");
}

const DISTRICT_ALIASES = {
  nashik: "NK",
  nasik: "NK",
  nsk: "NK",
  nk: "NK",
  pune: "PN",
  pn: "PN",
  nanded: "ND",
  nd: "ND",
  mumbai: "MUM",
  bombay: "MUM",
  mum: "MUM",
};

const TALUKA_ALIASES = {
  sinnar: "SIN",
  sinner: "SIN",
  sin: "SIN",
  yeola: "YEL",
  yel: "YEL",
  niphad: "NIP",
  dindori: "DIN",
  igatpuri: "IGA",
};

const STATE_ALIASES = {
  maharashtra: "MH",
  mh: "MH",
};

export async function resolveLocation({
  state = "Maharashtra",
  district = "",
  taluka = "",
  village = "",
  createMissing = true,
} = {}) {
  const stateCode = STATE_ALIASES[norm(state)] || codeFromName(state, 2);
  const stateId = `ST-${stateCode}`;
  let stateDoc = await State.findOne({ $or: [{ stateId }, { stateCode }] });
  if (!stateDoc && createMissing) {
    stateDoc = await State.create({
      stateId,
      stateCode,
      stateName: state || "Maharashtra",
      countryId: "IN",
      status: "ACTIVE",
    });
  }

  const districtCode =
    DISTRICT_ALIASES[norm(district)] || (district ? codeFromName(district, 3) : "XXX");
  const districtId = `DST-${districtCode}`;
  let districtDoc = await District.findOne({ $or: [{ districtId }, { districtCode, stateId }] });
  if (!districtDoc && district && createMissing) {
    districtDoc = await District.create({
      districtId,
      stateId,
      districtCode,
      districtName: district,
      status: "ACTIVE",
    });
  }

  const talukaCode = TALUKA_ALIASES[norm(taluka)] || (taluka ? codeFromName(taluka, 3) : "XXX");
  const talukaId = `TLK-${talukaCode}`;
  let talukaDoc = await Taluka.findOne({ $or: [{ talukaId }, { talukaCode, districtId }] });
  if (!talukaDoc && taluka && createMissing) {
    talukaDoc = await Taluka.create({
      talukaId,
      stateId,
      districtId,
      talukaCode,
      talukaName: taluka,
      status: "ACTIVE",
    });
  }

  let villageDoc = null;
  if (village) {
    villageDoc = await Village.findOne({
      talukaId,
      villageName: new RegExp(`^${village.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (!villageDoc && createMissing) {
      const villageId = await generateId({ module: "VIL", talukaCode });
      villageDoc = await Village.create({
        villageId,
        stateId,
        districtId,
        talukaId,
        villageCode: talukaCode,
        villageName: village,
        status: "ACTIVE",
      });
    }
  }

  return {
    stateId,
    stateCode,
    districtId,
    districtCode,
    talukaId,
    talukaCode,
    villageId: villageDoc?.villageId || "",
    stateDoc,
    districtDoc,
    talukaDoc,
    villageDoc,
  };
}

export function cityCode(city = "") {
  const n = norm(city);
  if (DISTRICT_ALIASES[n]) return DISTRICT_ALIASES[n];
  return codeFromName(city, 3);
}
