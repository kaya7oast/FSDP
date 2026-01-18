import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { retrieveChunks } from "./controllers/retrievalController.js";

dotenv.config();

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.post("/retrieve", retrieveChunks);

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
  console.log(`Retrieval service running on port ${PORT}`);
});
