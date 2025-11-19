import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["system", "user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  conversationId: { type: String, unique: true, required: true },
  userId: { type: String, required: true },
  agentId: { type: String, required: true },
  provider: { type: String, required: true },
  messages: [messageSchema],
  latestSummary: { type: String, default: "" },
  chatname: { type: String, default: "" },
  status: { type: String, enum: ["active", "deleted"], default: "active" },
});

// ⬇ force collection name "conversations"
export default mongoose.model("Conversation", conversationSchema, "conversations");


