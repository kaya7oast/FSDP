import mongoose from "mongoose";
import Counter from "./counterModel.js";

const chunkSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },

  // Auto-incremented but stored as string ("1", "2", ...)
  docId: {
    type: String,
    required: true,
    index: true
  },

  // Human-readable document name
  docName: {
    type: String,
    required: true
  },

  chunkIndex: {
    type: Number,
    required: true
  },

  text: {
    type: String,
    required: true
  },

  embedding: {
    type: [Number],
    required: true
  },

  source: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index
chunkSchema.index({ userId: 1, docId: 1 });

/**
 * Auto-increment docId only when creating the FIRST chunk of a document
 */
chunkSchema.pre("validate", async function () {
  if (this.docId) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "docId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  this.docId = counter.seq.toString();
});

export default mongoose.model("KnowledgeChunk", chunkSchema);
