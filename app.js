// -------------------------
// Imports
// -------------------------
import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

import connectDB from "./dbConfig.js";

// Agent conversation controllers
import {
  chatWithAgent,
  summarizeConversation,
  getConversation,
  deleteConversation,
  getAllConversations,
  changeProvider,
  test
} from "./agentDB/controllers/agentConvController.js";

// Database agent controllers (MongoDB)
import * as dbAgentController from "./agentDB/controllers/agentDBController.js";
// Agent Conversation Controller (MongoDB)
import * as agentConvController from "./agentDB/controllers/agentConvController.js";



dotenv.config();

// -------------------------
// Path setup
// -------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------
// Express App
// -------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Serve HTML Views
// -------------------------
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

// -------------------------
// Agent Chat API Routes
// -------------------------
app.post("/api/agents/:agentId/chat", agentConvController.chatWithAgent);
app.get("/api/conversation/:userId/:agentId", agentConvController.getConversation);
app.post("/api/conversation/:userId/:agentId/summarize", agentConvController.summarizeConversation);
app.delete("/api/conversation/:userId/:agentId", agentConvController.deleteConversation);
app.get("/api/conversations/:userId", agentConvController.getAllConversations);
app.put("/api/conversation/:userId/:agentId/change-provider", agentConvController.changeProvider);



app.get("/api/agents/test", test);


app.get("/api/conversations/:userId", getAllConversations);
app.put("/api/conversation/:userId/:agentId/change-provider", changeProvider);

// -------------------------
// Agent Database API Routes
// -------------------------
app.get("/api/agents", async (req, res) => {
  try {
    res.json(await dbAgentController.getAllAgents());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/agents/active", async (req, res) => {
  try {
    res.json(await dbAgentController.getActiveAgents());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/agents", async (req, res) => {
  try {
    res.json(await dbAgentController.addAgent(req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/agents/:agentId/delete", async (req, res) => {
  try {
    res.json(await dbAgentController.deleteAgent(req.params.agentId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/agents/:agentId", async (req, res) => {
  try {
    res.json(await dbAgentController.updateAgent(req.params.agentId, req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/agents/:agentId", async (req, res) => {
  try {
    const agent = await dbAgentController.getAgentById(req.params.agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// Test MongoDB Connection
// -------------------------
app.get("/test-db", async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// Static Files (CSS, JS, etc.)
// -------------------------
app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "public")));

// -------------------------
// Start Server
// -------------------------
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running at http://localhost:${PORT}`)
  );
});
