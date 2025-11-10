import Agent from "../models/agentDBModel.js"; // relative path to model

// Get all agents
export const getAllAgents = async () => {
  return await Agent.find();
};

// Get active agents
export const getActiveAgents = async () => {
  return await Agent.find({ Status: "Active" });
};

// Add a new agent
export const addAgent = async (agentData) => {
  const agent = new Agent(agentData);
  return await agent.save();
};
