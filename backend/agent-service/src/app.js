import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../dbConfig.js";
const PORT = 4001;

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

app.get("/agents", getAllAgents);
app.get("/agents/active", getActiveAgents);
app.post("/agents", addAgent);
// Use consistent param name `agentId` (lowercase) everywhere
app.put("/agents/:agentId", updateAgent);
app.post("/agents/:agentId/delete", deleteAgent);
app.get("/agents/:agentId", getAgentbyId);

app.listen(process.env.PORT, () =>
  console.log(`🟩 Agent Service running on ${process.env.PORT}`)
);
