import { extractText } from "../services/parserService.js";
import { chunkText } from "../services/chunkService.js";
import { embedText } from "../services/embeddingService.js";
import Chunk from "../models/chunkModel.js";

export async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.body.userId || "1";
    const docName = req.file.originalname;

    // 1️⃣ Extract & chunk text
    const text = await extractText(req.file.buffer, req.file.mimetype);
    const chunks = chunkText(text);

    if (!chunks.length) {
      return res.status(400).json({ error: "No text extracted from file" });
    }

    // 2️⃣ FIRST chunk → auto-generates docId
    const firstEmbedding = await embedText(chunks[0]);

    const firstChunk = new Chunk({
      userId,
      docName,
      chunkIndex: 0,
      text: chunks[0],
      embedding: firstEmbedding,
      source: docName
    });

    await firstChunk.save();

    const docId = firstChunk.docId; // 🔥 IMPORTANT

    const savedChunks = [firstChunk];

    // 3️⃣ Remaining chunks reuse SAME docId
    for (let i = 1; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i]);

      const chunk = new Chunk({
        userId,
        docId,
        docName,
        chunkIndex: i,
        text: chunks[i],
        embedding,
        source: docName
      });

      await chunk.save();
      savedChunks.push(chunk);
    }
    const userChunkCount = await Chunk.countDocuments({ userId });
  if (userChunkCount > 0) {
    const fileCount = await Chunk.aggregate([
      { $match: { userId: String(userId) } },
      { $group: { _id: "$docId" } },
      { $count: "total" }
    ]);
    
    if (fileCount[0]?.total > 5) {
      const oldestDoc = await Chunk.findOne({ userId: String(userId) }).sort({ createdAt: 1 });
      if (oldestDoc) {
        await Chunk.deleteMany({ userId: String(userId), docId: oldestDoc.docId });
      }
    }
  }

    res.json({
      message: "File processed successfully",
      docId,
      docName,
      totalChunks: savedChunks.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function getUserDocs(req, res) {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const docs = await Chunk.aggregate([
      { $match: { userId: String(userId) } },
      { $group: {
          _id: "$docId",
          docName: { $first: "$docName" },
          totalChunks: { $sum: 1 }
        }
      },
      { $project: {
          docId: "$_id",
          docName: 1,
          totalChunks: 1,
          _id: 0
        }
      }
    ]);
    res.json(docs);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteDocument(req, res) {
  try {
    const { userId, docId } = req.params;
    if (!userId || !docId) {
      return res.status(400).json({ error: "userId and docId parameters are required" });
    }
    const result = await Chunk.deleteMany({ userId: String(userId), docId: String(docId) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ message: "Document deleted successfully", deletedCount: result.deletedCount });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } 
}
