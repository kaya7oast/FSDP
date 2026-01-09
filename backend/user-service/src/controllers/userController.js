import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import Counter from "../models/counterModel.js";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...rest,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User created",
      userId: user.userId
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    // Example: req.user set by JWT middleware
    res.status(200).json({
      message: "User profile fetched",
      user: req.user || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const guestLogin = async (req, res) => {
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!counter || !counter.seq) {
      return res.status(500).json({ message: "Failed to generate userId" });
    }

    const guestPassword = await bcrypt.hash("guest", 10);

    const guestUser = await User.create({
      userId: counter.seq,   // ✅ REQUIRED
      username: "Guest",
      email: `guest${Date.now()}@example.com`,
      password: guestPassword
    });

    res.status(201).json({
      message: "Guest login successful",
      userId: guestUser.userId
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    // ✅ MUST select password explicitly
    const user = await User
      .findOne({ username })
      .select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Found user:", user.username);
    console.log("password exists:", !!user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ DECLARE token
    const token = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });

    res.json({
      message: "Login successful",
      userId: user.userId,
      token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "username, email and password are required"
      });
    }

    // ✅ PUT COUNTER CODE HERE
    const counter = await Counter.findByIdAndUpdate(
      { _id: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!counter || !counter.seq) {
      return res.status(500).json({ message: "Failed to generate userId" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId: counter.seq,   // ✅ REQUIRED
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user.userId
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



