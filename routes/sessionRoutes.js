const express = require("express");
const router = express.Router();
const {
  bookSession,
  getMySessions,
  getSessionById,
  updateSessionStatus,
  submitSessionFeedback,
  addSessionNotes,
  sendRemindersEndpoint,
} = require("../controllers/sessionController");
const { auth, checkRole } = require("../middleware/auth");

// All session routes require authentication
router.use(auth);

// Get all sessions for logged-in user
router.get("/", getMySessions);

// Book a new session
router.post("/", bookSession);

// Get specific session by ID
router.get("/:id", getSessionById);

// Update session status (confirm, cancel, complete)
router.put("/:id/status", updateSessionStatus);

// Submit feedback for a completed session (students only)
router.post("/:id/feedback", submitSessionFeedback);

// Add notes to a session
router.put("/:id/notes", addSessionNotes);

// Send session reminders (admin only)
router.post("/send-reminders", checkRole(["admin"]), sendRemindersEndpoint);

module.exports = router;
