import Conversation from "../models/conversationModel.js";

// -------------------------
// Test route
// -------------------------
export const test = (req, res) => {
  res.json({ message: "Test route working!" });
};

// -------------------------
// Chat with agent
// -------------------------
export const chatWithAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { userId, message } = req.body;

    let conversation = await Conversation.findOne({ userId, agentId });

    if (!conversation) {
      conversation = new Conversation({
        conversationId: Date.now().toString(),
        userId,
        agentId,
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({
      role: "user",
      content: message,
    });

    // Add simulated agent response
    conversation.messages.push({
      role: "assistant",
      content: "I'm processing your request.",
    });

    await conversation.save();

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Backend error" });
  }
};

// -------------------------
// Get a conversation
// -------------------------
export const getConversation = async (req, res) => {
  try {
    const { userId, agentId } = req.params;

    const conversation = await Conversation.findOne({ userId, agentId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Backend error" });
  }
};

// -------------------------
// Summarize conversation
// -------------------------
export const summarizeConversation = async (req, res) => {
  try {
    const { userId, agentId } = req.params;

    const conversation = await Conversation.findOne({ userId, agentId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    // Simple summary: concatenate all assistant messages
    const latestSummary = conversation.messages
      .filter((msg) => msg.role === "assistant")
      .map((msg) => msg.content)
      .join(" ");

    conversation.latestSummary = latestSummary;
    await conversation.save();

    res.json({ latestSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Backend error" });
  }
};

// -------------------------
// Delete a conversation
// -------------------------
export const deleteConversation = async (req, res) => {
  try {
    const { userId, agentId } = req.params;

    const conversation = await Conversation.findOneAndDelete({ userId, agentId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    res.json({ message: "Conversation deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Backend error" });
  }
};

// -------------------------
// Get all conversations for a user
// -------------------------
export const getAllConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({ userId });
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Backend error" });
  }
};

// -------------------------
// Change provider
// -------------------------
export const changeProvider = async (req, res) => {
  try {
    const { userId, agentId } = req.params;
    const { provider } = req.body;

    const conversation = await Conversation.findOne({ userId, agentId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    conversation.provider = provider;
    await conversation.save();

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Backend error" });
  }
};
