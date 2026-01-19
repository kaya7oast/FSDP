import KnowledgeChunk from "../models/KnowledgeChunk.js";
import axios from "axios";

const retrieveChunks = async (req, res) => {
  // logic
};




export async function retrieve(req, res) {
  try {
    const { query, userId, docId } = req.body;

    // 1️⃣ Embed user query
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

    // 2️⃣ Vector search
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector,
          numCandidates: 100,
          limit: 5,
          filter: {
            userId,
            ...(docId && { docId })
          }
        }
      },
      {
        $project: {
          text: 1,
          score: { $meta: "vectorSearchScore" },
          docId: 1
        }
      }
    ];

    const chunks = await KnowledgeChunk.aggregate(pipeline);

    res.json(chunks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Vector retrieval failed" });
  }
}

