import OpenAI from "openai";
import { getAgentById } from "../models/agentModel.js";
import Conversation from "../../agentDB/models/conversationModel.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// small service wrapper — you can move this to a separate file (e.g. services/agentService.js)


export const chatWithAgent = async (req, res) => {
  const { agentId } = req.params;
  const { message, endSession } = req.body;

  try {
    // 1️⃣ Get the agent from DB
    const agent = await getAgentById(agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    // 2️⃣ Load or create conversation
    let conversation = await Conversation.findOne({ agentId });
    if (!conversation) {
      conversation = new Conversation({
        agentId,
        messages: [
          {
            role: "system",
            content: `You are ${agent.name}, a ${agent.personality}. Your abilities: ${agent.capabilities.join(
              ", "
            )}.`,
          },
        ],
      });
    }

    // 3️⃣ Add user message
    conversation.messages.push({ role: "user", content: message });

    // 4️⃣ Limit to last 10 messages for OpenAI
    const messagesToSend = conversation.messages.slice(-10);

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: messagesToSend,
    });

    const reply = completion.choices[0].message.content;
    conversation.messages.push({ role: "assistant", content: reply });

    // 5️⃣ Summarize if session ends
    if (endSession) {
      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Summarize the following conversation concisely." },
          ...conversation.messages,
        ],
      });

      const summary = summaryCompletion.choices[0].message.content;
      conversation.messages = [
        { role: "system", content: "Summary of previous conversation: " + summary },
      ];
    }

    // 6️⃣ Save conversation and return reply
    await conversation.save();
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};







export const test = (req, res) => {
  console.log("Test endpoint called");
  res.json({ message: "Test successful" });
};
