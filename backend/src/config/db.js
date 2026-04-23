import mongoose from 'mongoose'
import { ENV } from './env.js'

export const connectDB = async () => {
    try {
        const connect = await mongoose.connect(ENV.DB_URL);
        console.log(`db connected ${connect.connection.host}`);
    } catch (error) {
        console.log("DB connection failed");
        console.log(error);
        process.exit(1)
    }
}