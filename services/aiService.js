import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Optional: Perplexity (if you have an API key)
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

/**
 * 🔹 Handle AI request dynamically by model type
 */
export const generateAIResponse = async (provider, messages) => {
  switch (provider) {
    case "openai":
      return await generateWithOpenAI(messages);
    case "gemini":
      return await generateWithGemini(messages);
    case "perplexity":
      return await generateWithPerplexity(messages);
    default:
      throw new Error("Unsupported AI provider");
  }
};

/**
 * 🔹 OpenAI handler
 */
const generateWithOpenAI = async (messages) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-5-nano",
    messages,
  });
  return completion.choices[0].message.content;
};

/**
 * 🔹 Gemini handler
 */
const generateWithGemini = async (messages) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  const result = await model.generateContent(prompt);
  return result.response.text();
};

/**
 * 🔹 Perplexity handler
 */

const generateWithPerplexity = async (messages) => {
  try {
    // ✅ Safely combine messages into a single prompt
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

    // ✅ Send request to Perplexity API
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar", // or "sonar-medium-chat"
        messages: [
          {
            role: "system",
            content: "You are a concise, helpful assistant. Keep replies short.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, // ✅ must use process.env
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Extract and return the model’s reply
    return response.data.choices?.[0]?.message?.content || "No response from Perplexity.";
  } catch (error) {
    console.error("❌ Perplexity API Error:", error.response?.data || error.message);
    throw new Error("Failed to generate response with Perplexity AI");
  }
};

export default generateWithPerplexity;

