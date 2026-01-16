import OpenAI from "openai";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateAIResponse(provider, messageOrMessages) {
  // 1. Normalize input
  let messagesArray = [];
  if (Array.isArray(messageOrMessages)) {
    messagesArray = messageOrMessages;
  } else if (typeof messageOrMessages === "string") {
    messagesArray = [{ role: "user", content: messageOrMessages }];
  } else if (messageOrMessages && typeof messageOrMessages === "object" && messageOrMessages.content) {
    messagesArray = [{ role: messageOrMessages.role || "user", content: messageOrMessages.content }];
  } else {
    messagesArray = [{ role: "user", content: "" }];
  }

  // 2. Helper to flatten messages for Gemini/Perplexity
  const promptFromMessages = (msgs) => msgs.map(m => `${m.role}: ${m.content}`).join("\n");

  // 3. SMART CHECK: Does the prompt ask for JSON?
  // We check the system prompt or user message for the keyword "JSON"
  const requiresJson = messagesArray.some(m => 
    m.content && m.content.toLowerCase().includes("json")
  );

  // --- OPENAI ---
  if (provider === "openai") {
    try {
      if (!process.env.OPENAI_API_KEY) return "OpenAI API key missing";
      
      const config = {
        model: "gpt-4o", // Upgraded to valid model
        messages: messagesArray,
      };

      // ONLY enable strict JSON mode if the prompt actually asks for it
      if (requiresJson) {
        config.response_format = { type: "json_object" };
      }

      const res = await openaiClient.chat.completions.create(config);
      return res?.choices?.[0]?.message?.content || "";
    } catch (err) {
      console.error("OpenAI Error:", err.message);
      // Return a safe fallback that works for both Voice (JSON) and Chat (Text)
      return requiresJson ? JSON.stringify({ reply: "OpenAI Error" }) : "I'm having trouble connecting.";
    }
  }

  // --- GEMINI ---
  if (provider === "gemini") {
    try {
      if (!process.env.GEMINI_API_KEY) return "Gemini API key missing";
      
      const config = { model: "gemini-1.5-flash" };
      if (requiresJson) {
        config.generationConfig = { responseMimeType: "application/json" };
      }

      const model = geminiClient.getGenerativeModel(config);
      const prompt = promptFromMessages(messagesArray);
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error("Gemini Error:", err.message);
      return requiresJson ? JSON.stringify({ reply: "Gemini Error" }) : "I'm having trouble connecting.";
    }
  }

  // --- PERPLEXITY ---
  if (provider === "perplexity") {
    try {
      if (!process.env.PERPLEXITY_API_KEY) return "Perplexity API key missing";
      
      const response = await axios.post(
        "https://api.perplexity.ai/chat/completions",
        {
          model: "sonar-small-chat", // Valid model
          messages: messagesArray
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      return response?.data?.choices?.[0]?.message?.content || "";
    } catch (err) {
      console.error("Perplexity Error:", err.message);
      return requiresJson ? JSON.stringify({ reply: "Perplexity Error" }) : "I'm having trouble connecting.";
    }
  }

  throw new Error("Invalid provider selected");
}