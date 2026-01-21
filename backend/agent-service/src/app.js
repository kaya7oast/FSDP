import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../dbConfig.js";
import { upload } from "../src/middlewares/upload.js";
import { uploadAndConvertToWord } from "../src/controllers/fileController.js";

import {
  getAllAgents,
  getActiveAgents,
  addAgent,
  deleteAgent,
  updateAgent,
  getAgentbyId,
} from "./controllers/agentController.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// Agent routes
app.get("/agents", getAllAgents);
app.get("/agents/active", getActiveAgents);
app.post("/agents", addAgent);
app.put("/agents/:agentId", updateAgent);
app.post("/agents/:agentId/delete", deleteAgent);
app.get("/agents/:agentId", getAgentbyId);

// File upload route directly on app (no router prefix)
app.post("/upload/convert-word", upload.single("file"), uploadAndConvertToWord);

// Start server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`🟩 Agent Service running on ${PORT}`));
