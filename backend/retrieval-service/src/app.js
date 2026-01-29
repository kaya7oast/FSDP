import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import protect from "./middlewares/authMiddleware.js";

import { retrieve } from "./controllers/retrievalController.js";

dotenv.config();

const app = express();

/* =======================
   Middleware
======================= */
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* =======================
   Health Check
======================= */
app.get("/test", (req, res) => {
  res.send("Retrieval service test route is working");
});

/* =======================
   Retrieval Endpoint
======================= */
app.post("/", retrieve);
app.post("/retrieve", protect, retrieve);

/* =======================
   MongoDB Connection
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Retrieval-service MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

/* =======================
   Server
======================= */
const PORT = 4005;
app.listen(PORT, () => {
  console.log(`Retrieval-service running on port ${PORT}`);
});
