import Conversation from "../models/conversationModel.js";
import Agent from "../models/agentDBModel.js"; // Import Agent model
import { generateAIResponse } from "../../services/aiService.js"; // Import AI Service

// -------------------------
// Chat with agent
// -------------------------
export const chatWithAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { userId, message } = req.body;

    // 1. Validate Agent exists
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // 2. Find or Create Conversation
    let conversation = await Conversation.findOne({ userId, agentId });

    if (!conversation) {
      conversation = new Conversation({
        conversationId: `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId,
        agentId,
        messages: []
      });
    }

    // 3. Add User Message
    conversation.messages.push({
      role: "user",
      content: message,
      createdAt: new Date()
    });

    // 4. Prepare Context for AI
    // Construct a system prompt based on the Agent's DB profile
    const systemPrompt = `You are ${agent.AgentName}. 
    Description: ${agent.Description || "A helpful assistant."}
    Personality: ${agent.Personality?.Tone || "Neutral"} and ${agent.Personality?.LanguageStyle || "Concise"}.
    Capabilities: ${agent.Capabilities?.join(", ") || "General tasks"}.
    Keep responses helpful and relevant to your persona.`;

    const messagesForAI = [
      { role: "system", content: systemPrompt },
      ...conversation.messages.slice(-10).map(msg => ({ // Send last 10 messages for context
        role: msg.role,
        content: msg.content
      }))
    ];

    // 5. Call AI Service
    // Defaulting to "openai" provider, but you can pass this in req.body if needed
    const aiResponseContent = await generateAIResponse("openai", messagesForAI);

    // 6. Add AI Message
    const aiMessage = {
      role: "assistant",
      content: aiResponseContent,
      createdAt: new Date()
    };
    conversation.messages.push(aiMessage);

    // 7. Save and Return
    await conversation.save();

    // Return the specific response object expected by the frontend
    res.json({ 
      reply: aiMessage,
      conversationId: conversation.conversationId
    });

  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ error: "Failed to process chat message" });
  }
};

// ... keep other exports like getConversation, summarizeConversation, etc. if they exist ...
// For completeness of this file based on your previous uploads:

export const getConversation = async (req, res) => {
  try {
    const { userId, agentId } = req.params;
    const conversation = await Conversation.findOne({ userId, agentId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
