import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  AgentID: { type: String, unique: true },  
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

  status: { type: String, enum: ["active", "deleted"], default: "active" }
});


// Auto-generate AgentID: A001, A002, A003...
agentSchema.pre("save", async function (next) {
  if (this.AgentID) return next(); // skip if already set

  const lastAgent = await this.constructor
    .findOne({}, {}, { sort: { CreatedAt: -1 } });

  let nextNumber = 1;

  if (lastAgent && lastAgent.AgentID) {
    const num = parseInt(lastAgent.AgentID.replace("A", ""));
    nextNumber = num + 1;
  }

  this.AgentID = "" + nextNumber.toString().padStart(3, "0");
  next();
});





const Agent = mongoose.model("agent", agentSchema, "agent");
export default Agent;


