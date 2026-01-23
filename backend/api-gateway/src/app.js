import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes.js";

dotenv.config();
const app = express();

app.use(cors());
// app.use(express.json());


// Load Proxy Routes
routes(app);

// Expose a simple health route and log the proxy targets on startup for debugging
app.get("/health", (req, res) => {
  res.json({ status: "ok", AGENT_SERVICE: process.env.AGENT_SERVICE, CONVERSATION_SERVICE: process.env.CONVERSATION_SERVICE });
});



console.log("API Gateway targets:", {
  AGENT_SERVICE: process.env.AGENT_SERVICE,
  CONVERSATION_SERVICE: process.env.CONVERSATION_SERVICE,
  AI_SERVICE: process.env.AI_SERVICE_URL,
  USER_SERVICE: process.env.USER_SERVICE,
  RETRIEVAL_SERVICE: process.env.RETRIEVAL_SERVICE,
  INGESTION_SERVICE: process.env.INGESTION_SERVICE,
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟧 API Gateway running on port ${PORT}`);
}
);
