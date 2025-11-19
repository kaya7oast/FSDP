import express from "express";
import dotenv from "dotenv";
import { generateAIResponse } from "./generateAIResponse.js";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { provider, message, messages } = req.body;
  // Accept either a single `message` string or an array `messages` from callers
  try {
    const input = messages || message;
    const response = await generateAIResponse(provider, input);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: (err && err.message) ? err.message + " from AI Service" : "AI Service error" });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`🟩 AI Service running on port ${process.env.PORT}`)
);
