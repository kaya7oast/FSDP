import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
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
  }
});

export default mongoose.model("User", userSchema);
