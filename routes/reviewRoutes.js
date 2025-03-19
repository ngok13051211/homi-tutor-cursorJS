const express = require("express");
const {
  getTutorReviews,
  getCourseReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/tutor/:tutorId", getTutorReviews);
router.get("/course/:courseId", getCourseReviews);

// Student-only routes
router.post("/", auth, checkRole(["student"]), createReview);

// Protected routes
router.put("/:id", auth, updateReview); // Controller handles permission check
router.delete("/:id", auth, deleteReview); // Controller handles permission check

module.exports = router;
