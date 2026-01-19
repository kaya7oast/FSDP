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
