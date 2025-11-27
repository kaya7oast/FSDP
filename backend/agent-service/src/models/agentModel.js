import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  AgentID: { type: String },

  AgentName: { type: String, required: true },

  Description: String,
  Specialization: String,
  Region: String,

  Personality: {
    Tone: String,
    LanguageStyle: String,
    Emotion: String,
    ToneValue: Number,
    StyleValue: Number,
    EmotionValue: Number
  },

  Capabilities: [String],

  KnowledgeBase: {
    Type: String,
    SourceURL: String
  },

  Integration: {
    WebhookURL: String,
    ConnectedAPIs: [String]
  },

  Analytics: {
    AverageResponseTime: Number,
    SatisfactionScore: Number
  },

  MemorySettings: {
    Enabled: Boolean,
    RetentionPolicy: String,
    ContextWindow: Number
  },

  TasksCompleted: Number,

  Owner: {
    UserID: String,
    UserName: String
  },

  Status: { type: String, enum: ["Active", "Deleted"], default: "Active" },

  CreatedAt: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now }
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
