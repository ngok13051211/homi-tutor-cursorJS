const jwt = require("jsonwebtoken");
const { User } = require("../models");

/**
 * Authentication middleware to protect routes
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
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
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action" });
    }

    next();
  };
};

module.exports = { auth, checkRole };
