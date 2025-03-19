const { Notification } = require("../models");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ message: "Failed to retrieve notifications" });
  }
});

/**
 * @desc    Create a new notification
 * @route   POST /api/notifications
 * @access  Private (Admin only)
 */
const createNotification = asyncHandler(async (req, res) => {
  try {
    const { recipient, type, title, message, relatedId } = req.body;

    if (!recipient || !type || !title || !message) {
      return res.status(400).json({
        message: "Please provide recipient, type, title, and message",
      });
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedId,
      read: false,
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

/**
 * @desc    Mark a notification as read
 * @route   POST /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if the notification belongs to the user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this notification" });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

/**
 * @desc    Mark all notifications as read
 * @route   POST /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res
      .status(500)
      .json({ message: "Failed to mark all notifications as read" });
  }
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if the notification belongs to the user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this notification" });
    }

    await notification.deleteOne();
    res.json({ message: "Notification removed" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

/**
 * Create a system announcement for all users or a specific role
 * @route POST /api/notifications/announcement
 * @access Private (Admin only)
 */
const createAnnouncement = async (req, res) => {
  try {
    const { role, title, message } = req.body;
    const { User } = require("../models"); // Import here to avoid circular dependency

    // Query users based on role (or all users if no role specified)
    const query = role ? { role } : {};
    const users = await User.find(query).select("_id");

    // Create a notification for each user
    const notifications = [];
    for (const user of users) {
      const notification = await Notification.create({
        recipient: user._id,
        type: "system_announcement",
        title,
        message,
        createdAt: Date.now(),
      });
      notifications.push(notification);
    }

    res.status(201).json({
      message: `Announcement sent to ${notifications.length} users`,
      count: notifications.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAnnouncement,
};
