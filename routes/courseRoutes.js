const express = require("express");
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
} = require("../controllers/courseController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getCourses);
router.get("/:id", getCourseById);

// Protected routes - only for tutors
router.post("/", auth, checkRole(["tutor", "admin"]), createCourse);
router.put("/:id", auth, updateCourse); // Controller handles permission check
router.delete("/:id", auth, deleteCourse); // Controller handles permission check

// Student enrollment route
router.post("/:id/enroll", auth, checkRole(["student"]), enrollCourse);

module.exports = router;
