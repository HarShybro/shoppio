import { Router } from "express";
import { getProductSummary } from "../controllers/summary.controller.js";

const router = Router();
router.get("/:productId", getProductSummary);

export default router;