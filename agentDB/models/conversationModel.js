import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: String,
  content: String,
});

const conversationSchema = new mongoose.Schema({
  agentId: String,
  messages: [messageSchema],
});

export default mongoose.model("Conversation", conversationSchema);
