import { extractText } from "../services/parserService.js";
import { chunkText } from "../services/chunkService.js";
import { embedText } from "../services/embeddingService.js";
import Chunk from "../models/chunkModel.js";

export async function uploadFile(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const text = await extractText(req.file.buffer, req.file.mimetype);
    const chunks = chunkText(text);

    const savedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i]);

      const doc = new Chunk({
        userId: req.body.userId || "1",
        docId: req.body.docId || req.file.originalname || "1",
        chunkIndex: i,
        text: chunks[i],
        embedding: embedding,
        source: req.file.originalname
      });

      await doc.save();
      savedChunks.push(doc);
    }

    res.json({ savedChunks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
