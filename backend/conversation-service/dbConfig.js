// dbConfig.js
import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conversation DB connected");
  } catch (err) {
    console.error("Conversation DB error:", err);
    process.exit(1);
  }
}

export default connectDB;

