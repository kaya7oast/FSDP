import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: {
    type: String, // Keeping as String to match your existing logic
    required: true,
    unique: true
  },

  username: {
    type: String,
    required: true
  },

  email: {
    type: String,
    unique: true,
    sparse: true
  },
  
  password: {
    type: String,
    required: true,
    // select: false // Password won't be sent in GET requests automatically
  },

  role: {
    type: String,
    enum: ["admin", "user", "guest"],
    default: "user"
  },

  designation: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: ["active", "suspended", "deleted"],
    default: "active"
  },

  lastLoginAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  customNodes: [{
    label: String,
    category: String,
    icon: String,
    content: String,
    usageCount: { type: Number, default: 0 }
  }]
});

export default mongoose.model("User", userSchema);