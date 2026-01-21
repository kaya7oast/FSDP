import KnowledgeChunk from "../models/KnowledgeChunk.js";
import axios from "axios";






export async function retrieve(req, res) {
  console.log("Retrieval request body:", req.body);

  try {
    const { query, userId, docId, docIds } = req.body;

    if (!query || !userId) {
      return res.status(400).json({ error: "query and userId required" });
    }

    const effectiveDocIds = Array.isArray(docIds)
      ? docIds
      : Array.isArray(docId)
        ? docId
        : docId
          ? [docId]
          : [];

    const embeddingResp = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        model: "text-embedding-3-small",
        input: query
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const queryVector = embeddingResp.data.data[0].embedding;

    const filter = { userId: String(userId) };

    if (effectiveDocIds.length > 0) {
      filter.docId = { $in: effectiveDocIds.map(String) };
    }

    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector,
          numCandidates: 1000,
          limit: 20,
          filter
        }
      },
      {
        $project: {
          text: 1,
          docId: 1,
          score: { $meta: "vectorSearchScore" }
        }
      },
      { $limit: 5 }
    ];

    const chunks = await KnowledgeChunk.aggregate(pipeline);
    res.json(chunks);

  } catch (err) {
    console.error("Vector retrieval failed:", err);
    res.status(500).json({ error: "Vector retrieval failed" });
  }
}


