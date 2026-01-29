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
// app.post("/conversations/:agentId/chat", chatWithAgent);
// app.get("/conversations/:conversationId", getConversation);
// app.get("/conversations/user/:userId", getAllConversations);
// app.post("/conversations/:conversationId/delete", deleteConversation);
// app.post("/conversations/:conversationId/summarize", summarizeConversation);
// app.get("/conversations", allConversations);

// app.post("/:agentId/chat", chatWithAgent);
// app.get("/:conversationId", getConversation);
// app.get("/user/:userId", getAllConversations);
// app.post("/:conversationId/delete", deleteConversation);
// app.post("/:conversationId/summarize", summarizeConversation);
// app.get("/", allConversations);

app.post("/:agentId/chat", protect, chatWithAgent);
app.get("/:conversationId", protect, getConversation);
app.get("/user/:userId", protect, getAllConversations);
app.post("/:conversationId/delete", protect, deleteConversation);
app.post("/:conversationId/summarize", protect, summarizeConversation);
app.get("/", protect, allConversations);


//test
app.get("/test", (req, res) => {
  res.send("Test route is working");
});


app.listen(process.env.PORT, () =>
  console.log(`🟦 Conversation Service running on ${process.env.PORT}`)
);
