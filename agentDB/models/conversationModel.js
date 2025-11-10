import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["system", "user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  conversationId: { type: String, unique: true, required: true }, // e.g. "USER123CONVAGENT1"
  userId: { type: String, required: true },
  agentId: { type: String, required: true },
  messages: [messageSchema],
  latestSummary: { type: String, default: "" },
});

export default mongoose.model("Conversation", conversationSchema);
