import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.INGESTION_DB)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Routes
app.use('/upload', uploadRoutes);

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => console.log(`Ingestion service running on port ${PORT}`));
