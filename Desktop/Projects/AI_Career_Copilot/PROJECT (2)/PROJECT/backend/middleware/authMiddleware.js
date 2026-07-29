import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    // 🔹 Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided."
      });
    }

    // 🔹 Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. Invalid token format."
      });
    }

    // 🔹 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Attach user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };

    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please login again."
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token. Please login again."
      });
    }

    res.status(500).json({ message: error.message });
  }
};