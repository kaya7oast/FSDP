import KnowledgeChunk from "../models/KnowledgeChunk.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const retrieveChunks = async (req, res) => {
  try {
    const { user_id, document_id, query } = req.body;

    if (!user_id || !document_id || !query) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 1️⃣ Embed user query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query
    });

    const queryVector = embeddingResponse.data[0].embedding;

    // 2️⃣ Vector search with metadata filtering
    const results = await KnowledgeChunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          queryVector,
          path: "embedding",
          filter: {
            owner_id: user_id,
            document_id: document_id
          },
          numCandidates: 100,
          limit: 5
        }
      },
      {
        $project: {
          _id: 0,
          chunk_text: 1,
          page: 1,
          chunk_index: 1
        }
      }
    ]);

    res.json({ chunks: results });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Retrieval failed" });
  }
};
