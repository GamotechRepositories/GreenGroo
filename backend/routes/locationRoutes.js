import express from "express";
import {
  getCities,
  getPincodeDetails,
  getPincodes,
  getStates,
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/states", getStates);
router.get("/cities", getCities);
router.get("/pincodes", getPincodes);
router.get("/pincode/:pincode", getPincodeDetails);

export default router;
