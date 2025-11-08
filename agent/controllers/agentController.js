import OpenAI from "openai";
import { getAgentById } from "../models/agentModel.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// small service wrapper — you can move this to a separate file (e.g. services/agentService.js)

export const chatWithAgent = async (req, res) => {
  console.log("chatWithAgent called");
  const { agentId } = req.params;
  const { message } = req.body;
  console.log("Received message for agent", agentId, ":", message);

  try {
    // const agent = await getAgent(agentId);
    // if (!agent) return res.status(404).json({ error: "Agent not found" });

//     const systemPrompt = `
// You are ${agent.name}, a ${agent.personality}.
// Your abilities: ${agent.capabilities.join(", ")}.
// `;
    const systemPrompt = `You are Word Master, a helpful. Your abilities: great elaborator with deep understanding.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    return res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const test = (req, res) => {
  console.log("Test endpoint called");
  res.json({ message: "Test successful" });
};
