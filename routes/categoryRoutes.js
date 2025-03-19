const express = require("express");
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Admin-only routes
router.post("/", auth, checkRole(["admin"]), createCategory);
router.put("/:id", auth, checkRole(["admin"]), updateCategory);
router.delete("/:id", auth, checkRole(["admin"]), deleteCategory);

module.exports = router;
