import express from "express";
import { optimizedImage } from "../controllers/imageController.js";

const router = express.Router();

router.get("/", optimizedImage);

export default router;
