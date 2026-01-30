import axios from "axios";

/**
 * Generate embeddings using OpenAI API
 */
export async function embedText(text) {
  if (!text) throw new Error("No text provided");

  if (!process.env.EMBEDDING_API_KEY) {
    console.error("❌ EMBEDDING_API_KEY environment variable is not set");
    throw new Error("EMBEDDING_API_KEY environment variable is not set");
  }

  try {
    console.log("📤 Sending embedding request to OpenAI API...");
    
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

    if (!response.data?.data?.[0]?.embedding) {
      console.error("❌ Invalid embedding response from API:", response.data);
      throw new Error("Invalid embedding response from API");
    }

    console.log("✅ Embedding generated successfully");
    return response.data.data[0].embedding;
  } catch (error) {
    console.error("❌ Embedding API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
      code: error.code,
      url: error.config?.url
    });
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}
