import axios from "axios";
import Conversation from "../models/conversationModel.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL; // e.g., http://ai-service:4000
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE; // e.g., http://agent-service:4001

// Helper: fetch agent details from agent-service
async function getAgentbyId(agentId) {
  if (!AGENT_SERVICE_URL) return null;
  try {
    const resp = await axios.get(`${AGENT_SERVICE_URL}/agents/${agentId}`);
    return resp.data; // Expected: { agent: { ... } }
  } catch (err) {
    console.error(`Error fetching agent ${agentId}:`, err.message);
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
    const agentResponse = await getAgentbyId(agentId);
    
    // SAFETY CHECK 1
    if (!agentResponse || !agentResponse.agent) {
      console.error("Agent not found in Agent Service");
      return res.status(404).json({ error: "Agent not found" });
    }

    const agent = agentResponse.agent;



    const personality = agent.Personality || {};

    const tone = personality.Tone || "helpful";

    const style = personality.LanguageStyle || "concise";

    const emotion = personality.Emotion || "neutral";


    const capabilities = Array.isArray(agent.Capabilities) 

      ? agent.Capabilities.join(", ") 

      : (agent.Capabilities || "General Assistance");


    const systemMessage = `

      You are ${agent.AgentName || "an AI Assistant"}.

      YOUR IDENTITY:

      - Role: ${agent.Specialization || "Assistant"}

      - Mission: ${agent.Description || "Help the user."}

      - Capabilities: ${capabilities}
    
      YOUR PERSONALITY:

      - Tone: ${tone}

      - Style: ${style}

      - Attitude: ${emotion}

      INSTRUCTIONS:

      Stay in character. Use your specific capabilities to help the user. 

      If asked what you can do, list your specific capabilities.

    `;

    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findOne({ conversationId });
    }

    // Fallback: Check if we have an existing convo for this user/agent
    if (!conversation) {
      conversation = await Conversation.findOne({ userId, agentId });
    }

    if (!conversation) {
      const newConversationId = generateConversationId(userId, agentId);

      conversation = new Conversation({
        conversationId: newConversationId,
        userId,
        agentId,
        provider,
        chatname: chatname || `Chat with ${agent.AgentName || "Agent"}`,
        messages: [
          {
            role: "system",
            content: systemMessage,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    conversation.messages.push({
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    });

    const messagesToSend = conversation.messages.slice(-10);

    const replyText = await generateAIResponse(provider, messagesToSend);

    const reply = {
      role: "assistant",
      content: replyText,
      createdAt: new Date().toISOString(),
    };

    conversation.messages.push(reply);
    await conversation.save();

    res.json({ 
      reply, 
      conversationId: conversation.conversationId 
    });

  } catch (err) {
    console.error("chatWithAgent Critical Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
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

export const allConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({});
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
