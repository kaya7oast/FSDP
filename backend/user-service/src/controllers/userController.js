import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import Counter from "../models/counterModel.js";
import jwt from "jsonwebtoken";

// REGISTER: Requires Username, Email, and Password
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists by email or username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or Email already in use" });
    }

    const counter = await Counter.findByIdAndUpdate(
      { _id: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId: counter.seq.toString(),
      username,
      email,
      password: hashedPassword
    });

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      message: "User registered successfully",
      userId: user.userId,
      token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN: Supports login via Username OR Email
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Include username in the response for personalization
    res.json({ 
      message: "Login successful", 
      userId: user.userId, 
      username: user.username, // Added this line
      token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ... existing registerUser and loginUser code ...

// GUEST LOGIN: Creates a temporary session for quick access
export const guestLogin = async (req, res) => {
  try {
    // Logic to handle guest access or return a specific guest token
    const guestId = "guest_" + Date.now();
    const token = jwt.sign({ userId: guestId, role: 'guest' }, process.env.JWT_SECRET, { expiresIn: "2h" });

    res.json({ message: "Guest login successful", userId: guestId, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET PROFILE: Fetches user details by their unique sequential ID
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findOne({ userId }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};