import express from "express";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose"; // ✅ Must import mongoose

import connectDB from "./dbConfig.js";
import { chatWithAgent,summarizeConversation, test } from "./agent/controllers/agentController.js";
import * as dbAgentController from "./agentDB/controllers/agentDBController.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());



// HTML routes
app.get("/agent-builder", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "agentBuilder.html"))
);
app.get("/homepage", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "agentHomepage.html"))
);
app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "agentDashboard.html"))
);
app.get("/agent-conversation", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "agentConversation.html"))
);
// OpenAI agent API route
app.post("/api/agents/:agentId/chat", chatWithAgent);
app.get("/api/agents/test", test);
app.post("/api/conversation/:userId/:agentId/summarize", summarizeConversation);


// MongoDB agentDB API routes
app.get("/api/agents", async (req, res) => {
  try {
    const agents = await dbAgentController.getAllAgents();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/agents/active", async (req, res) => {
  try {
    const activeAgents = await dbAgentController.getActiveAgents();
    res.json(activeAgents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/agents", async (req, res) => {
  try {
    const newAgent = await dbAgentController.addAgent(req.body);
    res.json(newAgent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Test MongoDB connection route
app.get("/test-db", async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static HTML/CSS/JS
app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB and start server
connectDB();
app.listen(PORT, () =>
  console.log(`🚀 Server listening on port ${PORT}`)
);
