import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header or cookies
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.error("[AUTH] No token found in headers or cookies");
    console.error("[AUTH] Authorization header:", req.headers.authorization);
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // Verify token with the same secret used to sign it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[AUTH] Token verified. UserId:", decoded.userId);

    // Set userId directly from JWT payload
    req.user = {
      userId: decoded.userId || decoded.id || decoded.sub
    };
    
    next();
  } catch (err) {
    console.error("[AUTH] Token verification failed:", err.message);
    console.error("[AUTH] JWT_SECRET configured:", !!process.env.JWT_SECRET);
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
};

export default protect;
