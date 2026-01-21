import dotenv from "dotenv";
import { embedText } from "../services/embeddingService.js";

dotenv.config();

async function test() {
  const embedding = await embedText("Hello, this is a test sentence");

  console.log("Embedding length:", embedding.length);
  console.log("First 5 numbers:", embedding.slice(0, 5));
}

test();
