import OpenAI from "openai";
import { getAgentById } from "../models/agentModel.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const chatWithAgent = async (req, res) => {
  const { agentId } = req.params;
  const { message } = req.body;

  const agent = getAgentById(agentId);
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  const systemPrompt = `
You are ${agent.name}, a ${agent.personality}.
Your abilities: ${agent.capabilities.join(", ")}.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  });

  res.json({ reply: completion.choices[0].message.content });
};
