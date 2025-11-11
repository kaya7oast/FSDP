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
  },


  CreatedAt: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now },

  Owner: {
    UserID: { type: String },
    UserName: { type: String },
  },

  status: { type: String, enum: ["active", "deleted"], default: "active" },
},
);



const Agent = mongoose.model("Agent", agentSchema, "Agent");
export default Agent;


