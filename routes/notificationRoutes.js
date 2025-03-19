const express = require("express");
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  createAnnouncement,
} = require("../controllers/notificationController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// User routes - require authentication
router.get("/", auth, getUserNotifications);
router.put("/:id/read", auth, markNotificationAsRead);
router.put("/read-all", auth, markAllNotificationsAsRead);
router.delete("/:id", auth, deleteNotification);

// Admin only routes
router.post("/", auth, checkRole(["admin"]), createNotification);
router.post("/announcement", auth, checkRole(["admin"]), createAnnouncement);

module.exports = router;
