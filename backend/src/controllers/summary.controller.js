import axios from "axios";
import { ENV } from "../config/env.js";

export async function getProductSummary(req, res) {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        const response = await axios.post(`${ENV.ML_SERVICE_URL}/summary`, {
            product_id: productId,
        });
        // console.log("SUmmary:" + response.data.summary);
        console.log("ML_SERVICE_URL:", ENV.ML_SERVICE_URL);
        console.log("Response from ML:", response.data);
        res.json({ summary: response.data.summary });
    } catch (error) {
        console.error("Summary error:", error.message);
        console.error("Full error:", error?.response?.data);
        res.status(500).json({
            error: "Failed to get product summary",
            details: error.message  // ← add this
        });
    }
}