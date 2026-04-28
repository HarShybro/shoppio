import express from 'express';
import path from 'path';
import { serve } from "inngest/express";
import { clerkMiddleware } from '@clerk/express'
import cors from 'cors'

import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';

import { functions, inngest } from "./config/inngest.js";

import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js";
import orderRoutes from "./routes/order.route.js";
import reviewRoutes from "./routes/review.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import paymentRoutes from "./routes/payment.route.js";
import summaryRoutes from "./routes/summary.route.js";

const app = express();

const __dirname = path.resolve();

app.use(
    "/api/payment",
    (req, res, next) => {
        if (req.originalUrl === "/api/payment/webhook") {
            express.raw({ type: "application/json" })(req, res, next);
        } else {
            express.json()(req, res, next); // parse json for non-webhook routes
        }
    },
    paymentRoutes
);

app.use(express.json());
app.use(clerkMiddleware());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }))

app.use("/api/inngest", serve({ client: inngest, functions }));
app.get('/api/health', (req, res) => {
    res.status(200).json({ msg: "working..." })
})

app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/summary', summaryRoutes);

// app.use('/api/payment', paymentRoutes);

if (ENV.NODE_ENV == "production") {
    app.use(express.static(path.resolve(__dirname, '../admin/dist')))

    app.get("/{*any}", (req, res) => {
        res.sendFile(path.join(__dirname, "../admin", "dist", 'index.html'));
    })
}

app.listen(ENV.PORT, () => {
    console.log('Server is running on port 3000');
    connectDB();
})


