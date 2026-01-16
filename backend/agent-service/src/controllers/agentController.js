import Agent from "../models/agentModel.js";

// CREATE agent
export const addAgent = async (req, res) => {
  try {
    const agent = new Agent(req.body); // pre-save hook triggers here
    if (agent.AgentID) {
      agent.AgentID = null;
    }
    await agent.save();
    res.json(agent);
  } catch (err) {
    console.error("addAgent j error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
export const getAgentbyId = async (req, res) => {
  try {
    const agentId = req.params.agentId; // normalized param name
    console.log("getAgentById param:", agentId);

    const agent = await Agent.findOne({ AgentID: String(agentId) });
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getAllAgents = async (req, res) => {
  try {
    // 1. Grab the userId from the URL query parameters
    const { userId } = req.query;

    // 2. Build the filter. 
    // IMPORTANT: Use "Owner.UserID" (quoted) to query the nested object
    const filter = userId ? { "Owner.UserID": userId } : {};

    // 3. Apply the filter to the Mongoose query
    // If filter is {}, it returns all. If it's { "Owner.UserID": "1" }, it personalizes.
    const agents = await Agent.find(filter);

    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET active agents
export const getActiveAgents = async (req, res) => {
  try {
    // Model uses `Status` field (capitalized) so query for that
    const agents = await Agent.find({ Status: "Active" });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE agent
export const updateAgent = async (req, res) => {
  try {
    const agent = await Agent.findByIdAndUpdate(
      req.params.agentId,
      req.body,
      { new: true }
    );
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE agent
export const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findOneAndUpdate(
      { AgentID: String(req.params.agentId) },
      { Status: "deleted" },
      { new: true }
    );
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
