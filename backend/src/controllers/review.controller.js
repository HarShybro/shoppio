// import { Order } from "../models/order.model.js";
// import { Product } from "../models/product.model.js";
// import { Review } from "../models/review.model.js";

// export async function createReview(req, res) {
//     try {
//         const { productId, orderId, rating } = req.body;

//         if (!rating || rating < 1 || rating > 5) {
//             return res.status(400).json({ error: "Rating must be between 1 and 5" });
//         }

//         const user = req.user;

//         // CHecking order exists and is delivered
//         const order = await Order.findById(orderId);
//         if (!order) {
//             return res.status(404).json({ error: "Order not found" });
//         }

//         if (order.clerkId !== user.clerkId) {
//             return res.status(403).json({ error: "Not authorized to review this order" });
//         }

//         if (order.status !== "delivered") {
//             return res.status(400).json({ error: "Can only review delivered orders" });
//         }

//         // check product is in the order
//         const productInOrder = order.orderItems.find(
//             (item) => item.product.toString() === productId.toString()
//         );
//         if (!productInOrder) {
//             return res.status(400).json({ error: "Product not found in this order" });
//         }

//         // atomic update or create
//         const review = await Review.findOneAndUpdate(
//             { productId, userId: user._id },
//             { rating, orderId, productId, userId: user._id },
//             { new: true, upsert: true, runValidators: true }
//         );

//         // update the product rating with atomic aggregation
//         const reviews = await Review.find({ productId });
//         const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
//         const updatedProduct = await Product.findByIdAndUpdate(
//             productId,
//             {
//                 averageRating: totalRating / reviews.length,
//                 totalReviews: reviews.length,
//             },
//             { new: true, runValidators: true }
//         );

//         if (!updatedProduct) {
//             await Review.findByIdAndDelete(review._id);
//             return res.status(404).json({ error: "Product not found" });
//         }

//         res.status(201).json({ message: "Review submitted successfully", review });
//     } catch (error) {
//         console.error("Error in createReview controller:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// }

// export async function deleteReview(req, res) {
//     try {
//         const { reviewId } = req.params;

//         const user = req.user;

//         const review = await Review.findById(reviewId);
//         if (!review) {
//             return res.status(404).json({ error: "Review not found" });
//         }

//         if (review.userId.toString() !== user._id.toString()) {
//             return res.status(403).json({ error: "Not authorized to delete this review" });
//         }

//         const productId = review.productId;
//         await Review.findByIdAndDelete(reviewId);

//         const reviews = await Review.find({ productId });
//         const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
//         await Product.findByIdAndUpdate(productId, {
//             averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
//             totalReviews: reviews.length,
//         });

//         res.status(200).json({ message: "Review deleted successfully" });
//     } catch (error) {
//         console.error("Error in deleteReview controller:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// }

import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";

export async function createReview(req, res) {
    try {
        const { productId, orderId, rating, comment } = req.body; // ← add comment

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        const user = req.user;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });

        if (order.clerkId !== user.clerkId) {
            return res.status(403).json({ error: "Not authorized to review this order" });
        }

        if (order.status !== "delivered") {
            return res.status(400).json({ error: "Can only review delivered orders" });
        }

        const productInOrder = order.orderItems.find(
            (item) => item.product.toString() === productId.toString()
        );
        if (!productInOrder) {
            return res.status(400).json({ error: "Product not found in this order" });
        }

        const review = await Review.findOneAndUpdate(
            { productId, userId: user._id },
            { rating, comment: comment?.trim() || "", orderId, productId, userId: user._id },
            { new: true, upsert: true, runValidators: true }
        );

        const reviews = await Review.find({ productId });
        const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                averageRating: totalRating / reviews.length,
                totalReviews: reviews.length,
            },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            await Review.findByIdAndDelete(review._id);
            return res.status(404).json({ error: "Product not found" });
        }

        res.status(201).json({ message: "Review submitted successfully", review });
    } catch (error) {
        console.error("Error in createReview controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// ← NEW: fetch reviews for product page
export async function getProductReviews(req, res) {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ productId })
            .sort({ createdAt: -1 })
            .lean();

        // attach username to each review
        const userIds = reviews.map((r) => r.userId);
        const users = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

        const enriched = reviews.map((r) => ({
            _id: r._id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            user: {
                name: userMap[r.userId.toString()]?.name || "User",
                image: userMap[r.userId.toString()]?.image || null,
            },
        }));

        res.json({ reviews: enriched });
    } catch (error) {
        console.error("Error in getProductReviews:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function deleteReview(req, res) {
    try {
        const { reviewId } = req.params;
        const user = req.user;

        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ error: "Review not found" });

        if (review.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to delete this review" });
        }

        const productId = review.productId;
        await Review.findByIdAndDelete(reviewId);

        const reviews = await Review.find({ productId });
        const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
        await Product.findByIdAndUpdate(productId, {
            averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
            totalReviews: reviews.length,
        });

        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error in deleteReview controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}