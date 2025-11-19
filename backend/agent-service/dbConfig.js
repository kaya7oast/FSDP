import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "agentDB"
    });
    console.log("🟩 Agent Service DB connected");
  } catch (err) {
    console.error("Agent Service DB error:", err);
  }
}

