import OpenAI from "openai";
import { getAgentById } from "../models/agentModel.js";
import Conversation from "../../agentDB/models/conversationModel.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// small service wrapper — you can move this to a separate file (e.g. services/agentService.js)


export const chatWithAgent = async (req, res) => {
  const { agentId } = req.params;
  const { userId, message } = req.body; // make sure your frontend sends userId

  try {
    const agent = await getAgentById(agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    // const conversationId = `${userId}CONV${agentId}`;
    const conversationId = `${0}CONV${0}`;

    let conversation = await Conversation.findOne({ conversationId });

    // Create a new conversation if it doesn't exist
    if (!conversation) {
      conversation = new Conversation({
        conversationId,
        userId,
        agentId,
        messages: [
          {
            role: "system",
            content: `You are ${agent.name}, a ${agent.personality}. Your abilities: ${agent.capabilities.join(", ")}.`,
          },
        ],
      });
    }

    // Add user message
    conversation.messages.push({
      role: "user",
      content: message,
    });

    const messagesToSend = conversation.messages.slice(-10);

    // Send to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: messagesToSend,
    });

    const reply = completion.choices[0].message.content;

    // Add assistant reply
    conversation.messages.push({
      role: "assistant",
      content: reply,
    });

    await conversation.save();

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const summarizeConversation = async (req, res) => {
  console.log("Summarize conversation endpoint called");
  try {
    const { userId, agentId } = req.params; // ✅ get from URL, not body
    const conversationId = `${userId}CONV${agentId}`;

    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    // Summarize the conversation using OpenAI
    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: "Summarize the following conversation concisely." },
        ...conversation.messages,
      ],
    });

    const summary = summaryCompletion.choices[0].message.content;
    conversation.latestSummary = summary;
    await conversation.save();

    res.json({
      message: "Conversation summarized successfully",
      summary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};





export const test = (req, res) => {
  console.log("Test endpoint called");
  res.json({ message: "Test successful" });
};

