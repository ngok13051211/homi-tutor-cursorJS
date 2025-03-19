const express = require("express");
const { User } = require("../models");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", auth, getUserProfile);
router.put("/profile", auth, updateUserProfile);

// Admin-only routes
router.get("/all", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
