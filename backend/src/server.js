import express from 'express';
import path from 'path';
import { serve } from "inngest/express";
import { clerkMiddleware } from '@clerk/express'

import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';

import { functions, inngest } from "./config/inngest.js";

const app = express();

const __dirname = path.resolve();

app.use(express.json());
app.use(clerkMiddleware());


app.use("/api/inngest", serve({ client: inngest, functions }));
app.get('/api/health', (req, res) => {
    res.status(200).json({ msg: "working..." })
})


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


