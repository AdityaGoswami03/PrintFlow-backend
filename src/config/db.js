import mongoose from 'mongoose';
import { env } from './env.js';
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      dbName: env.DB_NAME,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    console.log(
      `✅ MongoDB connected successfully to DB: ${mongoose.connection.name}`
    );
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    process.exit(1);
  }
};
