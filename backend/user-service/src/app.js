import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../dbConfig.js";
import {
  registerUser,
  loginUser,
  guestLogin,
  getUserProfile,
} from "./controllers/userController.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

// Health check for Docker monitoring
app.get("/health", (req, res) => {
  res.json({ status: "user-service running" });
});

// Define local endpoints for this service
app.post("/users/guest", guestLogin);
app.post("/users/register", registerUser);
app.post("/users/login", loginUser);
app.get("/users/profile", getUserProfile);

// Connect to MongoDB using the URI from .env
connectDB();

app.listen(PORT, () => {
  console.log(`👤 User Service running on port ${PORT}`);
});