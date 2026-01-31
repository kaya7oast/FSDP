import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../dbConfig.js";
import {
  registerUser,
  loginUser,
  guestLogin,
  getUserProfile,
  addCustomNode,
  authMe,
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
app.post("/guest", guestLogin);
app.post("/register", registerUser);
app.post("/login", loginUser);
app.get("/profile", getUserProfile);
app.post("/nodes", addCustomNode);
app.get("/auth/me", authMe);

// Test route
app.get("/test", (req, res) => {
  res.send("User Service test route is working");
});

// Connect to MongoDB using the URI from .env
connectDB();

app.listen(PORT, () => {
  console.log(`👤 User Service running on port ${PORT}`);
});