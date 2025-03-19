const { Notification } = require("../models");

/**
 * Get user's notifications
 * @route GET /api/notifications
 * @access Private
 */
const getUserNotifications = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Notification.countDocuments({
      recipient: req.user._id,
    });

    // Get count of unread notifications
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({
      notifications,
      page,
      pages: Math.ceil(total / limit),
      total,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this notification" });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 * @access Private
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this notification" });
    }

    await notification.remove();
    res.json({ message: "Notification removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a notification (Admin only)
 * @route POST /api/notifications
 * @access Private (Admin only)
 */
const createNotification = async (req, res) => {
  try {
    const { recipient, type, title, message, relatedItem } = req.body;

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedItem,
      createdAt: Date.now(),
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  createAnnouncement,
};
