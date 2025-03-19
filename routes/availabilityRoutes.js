const express = require("express");
const router = express.Router();
const {
  addAvailability,
  getMyAvailability,
  getTutorAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailableTimeSlots,
} = require("../controllers/availabilityController");
const { auth } = require("../middleware/auth");

// Protected routes (require authentication)
router.post("/", auth, addAvailability);
router.get("/me", auth, getMyAvailability);
router.put("/:id", auth, updateAvailability);
router.delete("/:id", auth, deleteAvailability);

// Public routes
router.get("/tutor/:tutorId", getTutorAvailability);
router.get("/slots/:tutorId/:date", getAvailableTimeSlots);

module.exports = router;
