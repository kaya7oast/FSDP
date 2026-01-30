import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  AgentID: { type: String },
  AgentName: { type: String, required: true },
  Description: String,
  Specialization: String,
  Region: String,
  isPublished: { type: Boolean, default: false },
  PublishedDescription: { type: String, default: "" },
  Likes: [{ type: String }],
  Saves: [{ type: String }],

  Personality: {
    Tone: String,
    LanguageStyle: String,
    Emotion: String,
    ToneValue: Number,
    StyleValue: Number,
    EmotionValue: Number
  },

  VisualNodes: { type: Array, default: [] }, 
  SystemPrompt: { type: String, default: "" }, // The "Brain"

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
    // We add index: true to make searching for "My Agents" lightning fast
    // We add required: true to ensure every agent has an owner
    UserID: { type: String, required: true, index: true }, 
    UserName: String
  },

  Status: { type: String, enum: ["Active", "Deleted", "Archived"], default: "Active" },

  CreatedAt: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now }
});

// Auto-generate AgentID before saving (remains exactly as you wrote it)
agentSchema.pre("save", async function (next) {
  if (this.AgentID) return next();

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