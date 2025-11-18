import OpenAI from "openai";
import { getAgentById } from "../models/agentModel.js";
import Conversation from "../../agentDB/models/conversationModel.js";
import { generateAIResponse } from "../../services/aiService.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


function generateConversationId(userId, agentId) {
  const randomPart = Math.random().toString(10).substring(2, 7).toUpperCase();
  return `${userId}CONVO${agentId}-${randomPart}`;
}



// small service wrapper — you can move this to a separate file (e.g. services/agentService.js)


export const chatWithAgent = async (req, res) => {
  const { agentId } = req.params;
  const { userId, message, provider = "gemini", chatname,conversationId = null } = req.body;

  try {
    const agent = await getAgentById(agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    
    let conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      conversation = new Conversation({
        conversationId: generateConversationId(userId, agentId), 
        userId,
        agentId,
        provider,
        chatname: chatname || `Chat with ${agent.name}`,
        messages: [
          {
            role: "system",
            // content: `You are ${agent.name}, a ${agent.personality}. Your abilities: ${agent.capabilities.join(", ")}.`,
            content: `You are Speech Master, a Smart. Your abilities: 10 words only.`,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    // Add user message with timestamp
    conversation.messages.push({
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    });

    const messagesToSend = conversation.messages.slice(-10);

    // Generate AI reply
    const replyText = await generateAIResponse(provider, messagesToSend);

    const reply = {
      content: replyText,
      createdAt: new Date().toISOString(),
    };

    // Save assistant reply with timestamp
    conversation.messages.push({
      role: "assistant",
      ...reply,
    });

    await conversation.save();

    // Return reply with timestamp
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};




export const summarizeConversation = async (req, res) => {
  const { userId, agentId, provider = "openai", conversationId } = req.params; // provider optional
  // const { userId, agentId, provider = "openai" } = req.body; // provider optional

  try {
    const conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Use AI to summarize the conversation
    const summary = await generateAIResponse(provider, [
      { role: "system", content: "Summarize the following conversation concisely." },
      ...conversation.messages,
    ]);

    // Save latest summary in the conversation
    conversation.latestSummary = summary;
    await conversation.save();

    res.json({ message: "Conversation summarized", summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getConversation = async (req, res) => {
  const { userId, agentId } = req.params;
  try {
    const conversationId = `${userId}CONV${agentId}`;
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    if (conversation.status === "deleted") {
      return res.status(410).json({ error: "Conversation has been deleted" });
    }
    res.json({ conversation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllConversations = async (req, res) => {
  const { userId } = req.params;
  try {
    const conversations = await Conversation.find({ userId, status: "active" });
    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changeProvider = async (req, res) => {
  const { userId, agentId } = req.params;
  const { newProvider } = req.body;

  try {
    const conversationId = `${userId}CONV${agentId}`;
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId },
      { provider: newProvider },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ message: "Provider changed successfully", conversation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteConversation = async (req, res) => {
  const { userId, agentId } = req.params;
  try {
    const conversationId = `${userId}CONV${agentId}`;
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId },
      { status: "deleted" },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ message: "Conversation deleted", conversation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const test = (req, res) => {
  console.log("Test endpoint called");
  res.json({ message: "Test successful" });
};

