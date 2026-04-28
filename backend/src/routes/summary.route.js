import { Router } from "express";
import { getProductSummary } from "../controllers/summary.controller.js";

const router = Router();
router.get("/:productId", (req, res, next) => {
    console.log("SUMMARY ROUTE HIT", req.params.productId);
    next();
}, getProductSummary);

export default router;