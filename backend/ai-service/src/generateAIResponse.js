import OpenAI from "openai";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
console.log("🔍 ALL ENVIRONMENT VARIABLES:");
const envKeys = Object.keys(process.env).sort();
envKeys.forEach(key => {
  if (key.toLowerCase().includes('deepseek') || 
      key.toLowerCase().includes('openai') || 
      key.toLowerCase().includes('gemini') || 
      key.toLowerCase().includes('perplexity')) {
    const value = process.env[key];
    const displayValue = value ? 
      `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 
      "undefined";
    console.log(`  ${key}: ${displayValue}`);
  }
});
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const deepseek = new OpenAI({baseURL: 'https://api.deepseek.com',apiKey: process.env.DEEPSEEK_API_KEY});

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
        model: "gpt-5", // GPT-5 enabled for all clients
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

  if (provider === "deepseek") {
    try {
      if (!process.env.DEEPSEEK_API_KEY) return "Deepseek API key not configured";
      
      const res = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: messagesArray
      });
      console.log("Deepseek response:", res);
      return res?.choices?.[0]?.message?.content || (res?.choices?.[0]?.text) || JSON.stringify(res);
    } catch (err) {
      console.error("Deepseek generate error:", err?.message || err);
      return "AI provider error (Deepseek)";
    }
  }
  
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