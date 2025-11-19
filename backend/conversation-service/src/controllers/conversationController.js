import axios from "axios";
import Conversation from "../models/conversationModel.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL; // e.g., http://ai-service:4000
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE; // e.g., http://agent-service:4001

// Helper: fetch agent details from agent-service
async function getAgentbyId(agentId) {
  if (!AGENT_SERVICE_URL) {
    console.error("AGENT_SERVICE URL not configured");
    return null;
  }

  try {
    const resp = await axios.get(`${AGENT_SERVICE_URL}/agents/${agentId}`);
    return resp.data;
  } catch (err) {
    console.error("getAgentbyId error:", err?.response?.data || err.message || err);
    return null;
  }
}

// Helper: call AI service to generate a response
async function generateAIResponse(provider = "openai", messages = []) {
  if (!AI_SERVICE_URL) {
    throw new Error("AI_SERVICE_URL not configured");
  }

  try {
    const resp = await axios.post(`${AI_SERVICE_URL}/generate`, {
      provider,
      messages,
    });

    // ai-service returns { response: '...' } (or similar). Try common shapes.
    if (resp.data) {
      if (typeof resp.data.response === "string") return resp.data.response;
      if (typeof resp.data.reply === "string") return resp.data.reply;
      // fallback: stringify useful parts
      return JSON.stringify(resp.data);
    }

    return "";
  } catch (err) {
    console.error("generateAIResponse error:", err?.response?.data || err.message || err);
    throw err;
  }
}

// Generate a conversation ID
function generateConversationId(userId, agentID) {
  const randomPart = Math.random().toString(10).substring(2, 7).toUpperCase();
  return `${userId}CONVO${agentID}-${randomPart}`;
}

// Chat with agent
export const chatWithAgent = async (req, res) => {
  const { agentId } = req.params;
  const { 
    userId, 
    message, 
    provider = "gemini", 
    chatname,
    conversationId = null 
  } = req.body;

  try {
    // -----------------------------
    // 1. Fetch Agent from agent-service
    // -----------------------------
    const agent = await getAgentbyId(agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    console.log("Fetched Agent:", agent);

    // -----------------------------
    // 2. Retrieve or Create Conversation
    // -----------------------------
    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findOne({ conversationId });
    }

    if (!conversation) {
      const newConversationId = generateConversationId(userId, agentId);

      conversation = new Conversation({
        conversationId: newConversationId,
        userId,
        agentId,
        provider,
        chatname: chatname || `Chat with ${agent.AgentName}`,
        messages: [
          {
            role: "system",
            // Example personality prompt — replace later
            content: `You are Speech Master, a Smart. Your abilities: 10 words only.`,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    // -----------------------------
    // 3. Add user message
    // -----------------------------
    conversation.messages.push({
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    });

    // Only send last 10 messages to AI
    const messagesToSend = conversation.messages.slice(-10);

    // -----------------------------
    // 4. Get AI response
    // -----------------------------
    const replyText = await generateAIResponse(provider, messagesToSend);

    const reply = {
      role: "assistant",
      content: replyText,
      createdAt: new Date().toISOString(),
    };

    // Save reply
    conversation.messages.push(reply);

    await conversation.save();

    // -----------------------------
    // 5. Return reply
    // -----------------------------
    res.json({ 
      reply, 
      conversationId: conversation.conversationId 
    });

  } catch (err) {
    console.error("chatWithAgent error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};



// Get conversation
export const getConversation = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (conversation.status === "deleted") return res.status(410).json({ error: "Conversation deleted" });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all conversations for a user
export const getAllConversations = async (req, res) => {
  const { userId } = req.params;
  try {
    const conversations = await Conversation.find({ userId, status: "active" });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Delete conversation
export const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId },
      { status: "deleted" },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    res.json({ message: "Conversation deleted", conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Summarize conversation
export const summarizeConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { provider = "openai" } = req.body;

  try {
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate`, {
      provider,
      messages: [
        { role: "system", content: "Summarize the following conversation concisely." },
        ...conversation.messages,
      ],
    });

    const summary = aiResponse.data.response || "No summary available";

    conversation.latestSummary = summary;
    await conversation.save();

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
