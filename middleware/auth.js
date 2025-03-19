const jwt = require("jsonwebtoken");
const { User } = require("../models");

/**
 * Authentication middleware to protect routes
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : authHeader;

    if (!token) {
      console.log("Authentication failed: No token provided");
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      console.log("Authentication failed: Invalid token structure");
      return res.status(401).json({ message: "Invalid token structure" });
    }

    // Find user by id
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log(
        `Authentication failed: User with ID ${decoded.id} not found`
      );
      return res.status(401).json({ message: "User not found" });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token format" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Token is not valid" });
  }
};

/**
 * Check if user has specific role
 * @param {Array} roles - Array of allowed roles
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const hasRole = roles.includes(req.user.role);
    if (!hasRole) {
      console.log(
        `Role check failed: User ${req.user._id} with role ${req.user.role} tried to access a restricted route`
      );
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action" });
    }

    next();
  };
};

module.exports = { auth, checkRole };
