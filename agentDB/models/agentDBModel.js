import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  AgentID: { type: String, required: true, unique: true },
  AgentName: { type: String, required: true },
  Specialization: String,
  Status: String,
  LastActive: Date,
  TasksCompleted: Number,
  Region: String,
});

const Agent = mongoose.model("Agent", agentSchema, "Agent");
export default Agent;


