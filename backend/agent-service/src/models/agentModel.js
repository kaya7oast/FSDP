import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  AgentID: { type: String},  
  AgentName: { type: String, required: true },
  Description: String,
  Specialization: String,
  Personality: {
    Tone: String,
    LanguageStyle: String,
    Emotion: String,
  },
  Capabilities: [String],
  KnowledgeBase: {
    Type: String,
  },
  CreatedAt: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now },
  Owner: {
    UserID: String,
    UserName: String,
  },
  Status: { type: String, enum: ["active", "deleted"], default: "active" }
});

// Auto-generate AgentID before saving
agentSchema.pre("save", async function (next) {
  if (this.AgentID) return next(); // skip if already set

  const lastAgent = await this.constructor
    .findOne({ AgentID: { $ne: null } })
    .sort({ CreatedAt: -1 });

  let nextNumber = 1;
  if (lastAgent && lastAgent.AgentID) {
    nextNumber = parseInt(lastAgent.AgentID) + 1;
  }

  this.AgentID = nextNumber.toString().padStart(3, "0");
  next();
});


const Agent = mongoose.model("agents", agentSchema, "agents");
export default Agent;
