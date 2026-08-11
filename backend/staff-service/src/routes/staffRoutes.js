import express from "express";
import { protect } from "@greengrocc/shared";
import {
  createAccount,
  getHierarchy,
  listStaff,
  login,
  me,
} from "../controllers/staffController.js";

const router = express.Router();

router.get("/hierarchy", getHierarchy);
router.post("/login", login);

router.use(protect);

router.get("/me", me);
router.get("/", listStaff);
router.post("/", createAccount);

export default router;
