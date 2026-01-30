import axios from "axios";

/**
 * Generate embeddings using OpenAI API
 */
export async function embedText(text) {
  if (!text) throw new Error("No text provided");

  const response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      model: "text-embedding-3-small",
      input: text,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
      },
    }
  );

  return response.data.data[0].embedding;
}
