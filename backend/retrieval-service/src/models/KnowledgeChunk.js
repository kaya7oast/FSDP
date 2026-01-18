import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // or String if JWT-based
    required: true,
    index: true
  },
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  chunkIndex: {
    type: Number
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

chunkSchema.index({ userId: 1, docId: 1 });

export default mongoose.model("KnowledgeChunk", chunkSchema);
