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
//test
app.get("/test", (req, res) => {
  res.send("AI Service test route is working");
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Service running on port ${PORT}`);
});
