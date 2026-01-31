import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../dbConfig.js";
import { upload } from "../src/middlewares/upload.js";
import { uploadAndConvertToWord } from "../src/controllers/fileController.js";

import { 
  getAllAgents,
  getActiveAgents,
  getPublishedAgents, // Make sure this is imported
  publishAgent,       // Make sure this is imported
  toggleLike,         // Make sure this is imported
  addAgent, 
  updateAgent,
  deleteAgent,
  getAgentbyId,
} from "./controllers/agentController.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// --- ADD THESE ROUTES BEFORE THE GENERIC /:agentId ROUTES ---
// (Order matters! /published must come before /:agentId)

// 1. Fetch published agents (Fixes 404 on /agents/published)
app.get("/published", getPublishedAgents);
app.get("/active", getActiveAgents);


app.put("/publish/:agentId", publishAgent);
app.post("/toggleLike/:agentId", toggleLike); 

// --- EXISTING ROUTES ---
app.get("/", getAllAgents);
app.post("/", addAgent);
app.put("/:agentId", updateAgent);
app.post("/:agentId/delete", deleteAgent);

app.get("/:agentId", getAgentbyId);

//test
app.get("/test", (req, res) => {
  res.send("Agent Service is running");
});

// File upload route directly on app (no router prefix)
app.post("/upload/convert-word", upload.single("file"), uploadAndConvertToWord);

// Start server
const PORT = process.env.PORT || 4001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Agent Service running on port ${PORT}`);
});