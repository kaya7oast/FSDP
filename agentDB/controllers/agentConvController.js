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
// ...existing code...
export const chatWithAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    // try common places for userId
    let { userId, message, provider } = req.body;
    userId = userId ?? req.params.userId ?? req.user?.id;

    // debug logging to trace incoming data
    console.debug('chatWithAgent req.params=', req.params);
    console.debug('chatWithAgent req.body=', req.body);
    console.debug('chatWithAgent req.headers=', req.headers);

    if (!userId) {
      console.error('chatWithAgent: missing userId');
      return res.status(400).json({ error: 'userId is required in request body or params or req.user' });
    }
    if (!message) {
      return res.status(400).json({ error: 'message is required in request body' });
    }

    let conversation = await Conversation.findOne({ userId, agentId });

    if (!conversation) {
      conversation = new Conversation({
        conversationId: Date.now().toString(),
        userId,
        agentId,
        messages: [],
        provider: provider ?? 'openai',            // ensure provider default
        status: req.body.status ?? 'active',
        latestSummary: req.body.latestSummary ?? '',
        chatName: req.body.chatName ?? `chat-${Date.now()}`,
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

    // Log the document just before saving so you can see missing fields
    console.debug('Saving conversation:', {
      conversationId: conversation.conversationId,
      userId: conversation.userId,
      agentId: conversation.agentId,
      provider: conversation.provider,
      messagesCount: conversation.messages.length,
    });

    await conversation.save();

    res.json(conversation);
  } catch (err) {
    console.error('chatWithAgent error:', err);
    // return validation details if available
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', message: err.message, details: err.errors });
    }
    // in dev, return error message and stack to the client for debugging
    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      error: 'Backend error',
      message: isDev ? err.message : undefined,
      stack: isDev ? err.stack : undefined,
    });
  }
};
// ...existing code...

// -------------------------
// Get a conversation
// -------------------------
export const getConversation = async (req, res) => {
  try {
    const { userId, agentId } = req.params;

    const conversation = await Conversation.findOne({ userId: "67", agentId });
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
