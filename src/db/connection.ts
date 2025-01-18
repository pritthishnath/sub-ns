import mongoose from "mongoose";
import { config } from "../config";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
