import OpenAI from "openai";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateAIResponse(provider, messageOrMessages) {
  // Normalize input: accept string or array of {role, content}
  let messagesArray = [];
  if (Array.isArray(messageOrMessages)) {
    messagesArray = messageOrMessages;
  } else if (typeof messageOrMessages === "string") {
    messagesArray = [{ role: "user", content: messageOrMessages }];
  } else if (messageOrMessages && typeof messageOrMessages === "object" && messageOrMessages.content) {
    // single message object
    messagesArray = [{ role: messageOrMessages.role || "user", content: messageOrMessages.content }];
  } else {
    messagesArray = [{ role: "user", content: "" }];
  }

  // Helper to collapse messages into a prompt string for providers that need a single text input
  const promptFromMessages = (msgs) => msgs.map(m => `${m.role}: ${m.content}`).join("\n");

  if (provider === "openai") {
    try {
      if (!process.env.OPENAI_API_KEY) return "OpenAI API key not configured";
      // OpenAI chat endpoint accepts a messages array directly
      const res = await openaiClient.chat.completions.create({
        model: "gpt-5-nano",
        messages: messagesArray
      });
      console.log("OpenAI response:", res);
      return res?.choices?.[0]?.message?.content || (res?.choices?.[0]?.text) || JSON.stringify(res);
    } catch (err) {
      console.error("OpenAI generate error:", err?.message || err);
      return "AI provider error (OpenAI)";
    } 
  }

  if (provider === "gemini") {
    try {
      if (!process.env.GEMINI_API_KEY) return "Gemini API key not configured";
      const model = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      // Gemini SDK may expect a text prompt — convert messages to a prompt string
      const prompt = promptFromMessages(messagesArray);
      const result = await model.generateContent(prompt);
      console.log("Gemini response:", result);
      // Try common shapes safely
      if (result?.response?.text) return result.response.text;
      if (typeof result === "string") return result;
      if (result?.candidates && result.candidates.length) {
        return JSON.stringify(result.candidates[0]);
      }
      return JSON.stringify(result);
    } catch (err) {
      console.error("Gemini generate error:", err?.message || err);
      return "AI provider error (Gemini)";
    }
  }

  if (provider === "perplexity") {
    try {
      if (!process.env.PERPLEXITY_API_KEY) return "Perplexity API key not configured";
      const response = await axios.post(
        "https://api.perplexity.ai/chat/completions",
        {
          model: "sonar",
          messages: messagesArray
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      console.log("Perplexity response:", response.data);
      return response?.data?.choices?.[0]?.message?.content || JSON.stringify(response.data);
    } catch (err) {
      console.error("Perplexity generate error:", err?.message || err);
      return "AI provider error (Perplexity)";
    }
  }

  throw new Error("Invalid provider selected");
}
