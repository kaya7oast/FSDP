import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../dbConfig.js";
import { upload } from "../src/middlewares/upload.js";
import { uploadAndConvertToWord } from "../src/controllers/fileController.js";
import protect from "./middlewares/authMiddleware.js";

import {
  getAllAgents,
  getActiveAgents,
  addAgent,
  deleteAgent,
  updateAgent,
  getAgentbyId,
  getAgentsByUserId,
} from "./controllers/agentController.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// Agent routes
// app.get("/agents", getAllAgents);
// app.get("/agents/active", getActiveAgents);
// app.post("/agents", addAgent);
// app.put("/agents/:agentId", updateAgent);
// app.post("/agents/:agentId/delete", deleteAgent);
// app.get("/agents/:agentId", getAgentbyId);

// app.get("/", getAllAgents);
// app.get("/active", getActiveAgents);
// app.post("/", addAgent);
// app.put("/:agentId", updateAgent);
// app.post("/:agentId/delete", deleteAgent);
// app.get("/:agentId", getAgentbyId);

app.get("/", protect, getAllAgents);
  app.get("/active", getActiveAgents);
  app.post("/", protect, addAgent);
  app.put("/:agentId", protect, updateAgent);
  app.post("/:agentId/delete", protect, deleteAgent);
  app.get("/:agentId", protect, getAgentbyId);
  app.get("/user/:userId", protect, getAgentsByUserId);

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

