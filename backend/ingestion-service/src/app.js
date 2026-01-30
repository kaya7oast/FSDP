import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { uploadFile, getUserDocs, deleteDocument } from "./controllers/uploadController.js";
import mongoose from "mongoose";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 4006; 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer(); // in-memory storage

// --------------------
// Upload routes directly in app.js
// --------------------

// Upload a single file
app.post("/upload", upload.single("file"), uploadFile);

// Get user documents
app.get("/docs/:userId", getUserDocs);

// Delete a specific document
app.delete("/docs/:userId/:docId", deleteDocument);

// Health route
app.get("/test", (req, res) => {
  res.send("ingestion Test route is working");
});

// ingestion-service/src/app.js

mongoose.connect(process.env.INGESTION_DB)
  .then(() => {
    console.log('✅ Ingestion-service MongoDB connected');
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Ingestion service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ CRITICAL: MongoDB connection error:', err);
    process.exit(1); 
  });
