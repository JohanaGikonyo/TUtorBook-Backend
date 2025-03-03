const jwt = require("jsonwebtoken");
const { JWT } = require("./config.js");
const verifyToken = (req, res, next) => {
  console.log("Headers received:", req.headers);

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("No auth header found");
    return res.status(401).json({ message: "No authentication token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("No token found in auth header");
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, JWT);
    console.log("Decoded token:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Token verification failed:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
module.exports = { verifyToken };
