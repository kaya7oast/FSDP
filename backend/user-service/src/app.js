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

app.get("/health", (req, res) => {
  res.json({ status: "user-service running" });
});

app.post("/users/guest", guestLogin);
app.post("/users/register", registerUser);
app.post("/users/login", loginUser);
app.get("/users/profile", getUserProfile);

connectDB();

app.listen(PORT, () => {
  console.log(`👤 User Service running on port ${PORT}`);
});
