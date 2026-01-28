import Agent from "../models/agentModel.js";

// --- 1. THE COMPILER HELPER ---
// Transforms visual nodes into a text prompt
const compileNodesToPrompt = (nodes) => {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return "You are a helpful AI assistant."; 
  }

  let promptParts = [];

  // Identity
  const identityNodes = nodes.filter(n => n.data?.category?.toUpperCase().includes('IDENTITY') || n.data?.category === 'CORE');
  if (identityNodes.length > 0) {
    promptParts.push("### YOUR IDENTITY");
    identityNodes.forEach(n => promptParts.push(`- Role: ${n.data.label}\n- Instructions: ${n.data.content}`));
  }

  // Knowledge
  const knowledgeNodes = nodes.filter(n => n.data?.category?.toUpperCase().includes('KNOWLEDGE'));
  if (knowledgeNodes.length > 0) {
    promptParts.push("\n### YOUR KNOWLEDGE BASE");
    knowledgeNodes.forEach(n => promptParts.push(`- [${n.data.label}]: ${n.data.content}`));
  }

  // Outputs/Rules
  const styleNodes = nodes.filter(n => n.data?.category?.match(/Controls|Output/i));
  if (styleNodes.length > 0) {
    promptParts.push("\n### OPERATIONAL RULES");
    styleNodes.forEach(n => promptParts.push(`- ${n.data.label}: ${n.data.content}`));
  }

  return promptParts.join("\n\n");
};

// --- 2. CREATE AGENT (Updated) ---
// --- 2. CREATE AGENT (Updated for Personalization) ---
export const addAgent = async (req, res) => {
  try {
    console.log("📥 Microservice received agent payload...");
    
    // Extract Owner along with other fields
    const { AgentName, WorkflowVisual, Capabilities, Owner, ...otherData } = req.body;
    
    const nodes = WorkflowVisual?.visual?.nodes || [];
    const compiledSystemPrompt = compileNodesToPrompt(nodes);

    const finalCapabilities = Array.isArray(Capabilities) 
      ? Capabilities 
      : (typeof Capabilities === 'string' ? Capabilities.split(',') : []);

    const agent = new Agent({
      AgentName: AgentName || "Unnamed Agent",
      VisualNodes: nodes,
      SystemPrompt: compiledSystemPrompt,
      Capabilities: finalCapabilities,
      Owner: {
        UserID: Owner?.UserID, // This comes from localStorage on the frontend
        UserName: Owner?.UserName
      },
      ...otherData
    });

    if (agent.AgentID) agent.AgentID = null;

    await agent.save();
    res.json(agent);
  } catch (err) {
    console.error("addAgent Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// --- GET AGENT BY ID ---
export const getAgentbyId = async (req, res) => {
  try {
    const agentId = req.params.agentId; 
    const agent = await Agent.findOne({ AgentID: String(agentId) });
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- GET ALL AGENTS ---
// --- GET ALL USER-SPECIFIC AGENTS ---
export const getAllAgents = async (req, res) => {
  try {
    const { userId } = req.query; // Retrieve the userId passed in the URL

    if (!userId) {
      return res.status(400).json({ error: "User ID is required to fetch agents" });
    }

    // Filter by BOTH the Owner's ID and the Status
    const agents = await Agent.find({ 
      "Owner.UserID": userId, 
      Status: { $ne: "deleted" } 
    });
    
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- GET ACTIVE AGENTS ---
// --- GET ACTIVE USER-SPECIFIC AGENTS ---
export const getActiveAgents = async (req, res) => {
  try {
    const { userId } = req.query;

    const agents = await Agent.find({ 
      "Owner.UserID": userId, 
      Status: "Active" 
    });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- UPDATE AGENT ---
export const updateAgent = async (req, res) => {
  try {
    const agent = await Agent.findByIdAndUpdate(req.params.agentId, req.body, { new: true });
    res.json(agent);
  } catch (err) { 
    res.status(500).json({ error: err.message });
  }
};

// --- DELETE AGENT ---
export const deleteAgent = async (req, res) => {
  try {
    // FIX: Must use findByIdAndUpdate for Mongo _id
    const agent = await Agent.findByIdAndUpdate(
      req.params.agentId, 
      { Status: "deleted" },
      { new: true }
    );
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};