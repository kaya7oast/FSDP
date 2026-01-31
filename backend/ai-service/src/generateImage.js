import OpenAI from "openai";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAIImage(prompt) {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API key missing");

    const response = await openaiClient.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    return response.data[0].url;
  } catch (err) {
    console.error("Image Generation Error:", err.message);
    throw err;
  }
}