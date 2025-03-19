const express = require("express");
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAnnouncement,
} = require("../controllers/notificationController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(auth);

// GET /api/notifications - Get all notifications for the logged-in user
router.get("/", getNotifications);

// POST /api/notifications - Create a new notification (admin only)
router.post("/", checkRole(["admin"]), createNotification);

// POST /api/notifications/:id/read - Mark a notification as read
router.post("/:id/read", markAsRead);

// POST /api/notifications/read-all - Mark all notifications as read
router.post("/read-all", markAllAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete("/:id", deleteNotification);

// Admin only routes
router.post("/announcement", checkRole(["admin"]), createAnnouncement);

module.exports = router;
