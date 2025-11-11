import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  AgentID: { type: String, required: true },
  AgentName: { type: String, required: true },
  Description: { type: String },

  Specialization: { type: String },

  Personality: {
    Tone: { type: String },
    LanguageStyle: { type: String },
    Emotion: { type: String },
  },

  Capabilities: [{ type: String }],

  KnowledgeBase: {
    Type: { type: String },
    SourceURL: { type: String },
  },

  MemorySettings: {
    Enabled: { type: Boolean, default: false },
    RetentionPolicy: { type: String },
    ContextWindow: { type: Number },
  },

  Status: { type: String },
  LastActive: { type: Date },
  TasksCompleted: { type: Number },
  Region: { type: String },
  Version: { type: String },

  CreatedAt: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now },

  Owner: {
    UserID: { type: String },
    UserName: { type: String },
  },

  Analytics: {
    AverageResponseTime: { type: Number },
    SatisfactionScore: { type: Number },
  },

  Integration: {
    ConnectedAPIs: [{ type: String }],
    WebhookURL: { type: String },
  },
  status: { type: String, enum: ["active", "deleted"], default: "active" },
},
{
  collection: "Agent", // 👈 ensures it uses your exact MongoDB collection name
  versionKey: false
},

);



const Agent = mongoose.model("Agent", agentSchema, "Agent");
export default Agent;


