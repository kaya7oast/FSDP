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
export const addAgent = async (req, res) => {
  try {
    const { AgentName, WorkflowVisual, Capabilities, ...otherData } = req.body;
    const nodes = WorkflowVisual?.visual?.nodes || [];
    const compiledSystemPrompt = compileNodesToPrompt(nodes);

    const finalCapabilities = Array.isArray(Capabilities)
      ? Capabilities
      : (typeof Capabilities === "string" ? Capabilities.split(",") : []);

    const agent = new Agent({
      AgentName: AgentName || "Unnamed Agent",
      VisualNodes: nodes,
      SystemPrompt: compiledSystemPrompt,
      Capabilities: finalCapabilities,
      Owner: {
        UserID: req.user.userId,   // ✅ Attach owner
        UserName: req.user.username
      },
      ...otherData
    });

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
export const getAllAgents = async (req, res) => {
  try {
    const query = { Status: { $ne: "Deleted" } };

    // Admin can see all, users see only theirs
    if (req.user.role !== "admin") {
      query["Owner.UserID"] = req.user.userId;
    }

    const agents = await Agent.find(query);
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- GET ACTIVE AGENTS ---
export const getActiveAgents = async (req, res) => {
  try {
    const agents = await Agent.find({ Status: "Active" });
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

export const getAgentsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const agents = await Agent.find({ "Owner.UserID": userId, Status: { $ne: "Deleted" } });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};