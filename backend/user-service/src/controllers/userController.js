import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import Counter from "../models/counterModel.js";
import jwt from "jsonwebtoken";

// AUTH ME: verify token and return minimal user info
export const authMe = async (req, res) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ userId: user.userId, username: user.username, email: user.email });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// REGISTER: Requires Username, Email, and Password
export const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username});
    if (existingUser) {
      return res.status(400).json({ message: "Username already in use" });
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

// LOGIN: Supports login via Username
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({ username }).select("+password");

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

export const addCustomNode = async (req, res) => {
  try {

    console.log("🔍 USER SERVICE RECEIVED:", JSON.stringify(req.body, null, 2));

    const { userId, nodeData } = req.body; // Expecting userId and the node object

    if (!userId || !nodeData) {
      return res.status(400).json({ message: "Missing userId or nodeData" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add to array
    user.customNodes.push(nodeData);
    await user.save();

    res.status(201).json(user.customNodes); // Return the updated list
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ DELETE NODE
export const deleteCustomNode = async (req, res) => {
  try {
    const { userId, nodeId } = req.params;
    
    // MongoDB $pull operator removes an item from an array
    await User.updateOne(
      { userId }, 
      { $pull: { customNodes: { _id: nodeId } } }
    );

    // Return the fresh list
    const user = await User.findOne({ userId });
    res.json(user.customNodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ EDIT NODE
export const updateCustomNode = async (req, res) => {
  try {
    const { userId, nodeId } = req.params;
    const { nodeData } = req.body;

    // MongoDB array filter to update specific item
    await User.updateOne(
      { userId, "customNodes._id": nodeId },
      { 
        $set: { 
          "customNodes.$.label": nodeData.label,
          "customNodes.$.category": nodeData.category,
          "customNodes.$.icon": nodeData.icon,
          "customNodes.$.content": nodeData.content
        } 
      }
    );

    const user = await User.findOne({ userId });
    res.json(user.customNodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};