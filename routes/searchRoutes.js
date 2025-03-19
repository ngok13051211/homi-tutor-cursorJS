const express = require("express");
const {
  searchCourses,
  searchTutors,
} = require("../controllers/searchController");

const router = express.Router();

// Public routes
router.get("/courses", searchCourses);
router.get("/tutors", searchTutors);

module.exports = router;
