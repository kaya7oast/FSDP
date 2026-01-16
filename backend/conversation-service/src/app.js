import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import protect from "./middlewares/authMiddleware.js";


import {
  chatWithAgent,
  getConversation,
  getAllConversations,
  deleteConversation,
  summarizeConversation,
  allConversations,
} from "./controllers/conversationController.js";
import { all } from "axios";


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, { dbName: "conversationDB" })
  .then(() => console.log("Conversation DB connected"))
  .catch(err => console.error("Conversation DB connection error:", err));

// Routes
app.post("/conversations/:agentId/chat",  chatWithAgent);
app.get("/conversations/:conversationId",  getConversation);
app.get("/conversations/user/:userId", getAllConversations);
app.post("/conversations/:conversationId/delete", deleteConversation);
app.post("/conversations/:conversationId/summarize", summarizeConversation);
app.get("/conversations", allConversations);


app.listen(process.env.PORT, () =>
  console.log(`🟦 Conversation Service running on ${process.env.PORT}`)
);
