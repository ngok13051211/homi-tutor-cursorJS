const { Notification, User } = require("../models");

/**
 * Create a notification for a specific user
 * @param {string} userId - The recipient user ID
 * @param {string} type - The notification type (session, message, payment, system, course)
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} relatedId - Optional related item ID
 * @returns {Promise<Object>} - The created notification object
 */
const createNotification = async (
  userId,
  type,
  title,
  message,
  relatedId = null
) => {
  try {
    const notification = await Notification.create({
      recipient: userId,
      type,
      title,
      message,
      relatedId,
      read: false,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {string} type - The notification type (session, message, payment, system, course)
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} relatedId - Optional related item ID
 * @returns {Promise<Array>} - Array of created notification objects
 */
const createMultipleNotifications = async (
  userIds,
  type,
  title,
  message,
  relatedId = null
) => {
  try {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        createNotification(userId, type, title, message, relatedId)
      )
    );

    return notifications;
  } catch (error) {
    console.error("Error creating multiple notifications:", error);
    throw error;
  }
};

/**
 * Create a notification for all users with a specific role
 * @param {string} role - The role of users to notify ('student', 'tutor', 'admin')
 * @param {string} type - The notification type (session, message, payment, system, course)
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} relatedId - Optional related item ID
 * @returns {Promise<Array>} - Array of created notification objects
 */
const notifyUsersByRole = async (
  role,
  type,
  title,
  message,
  relatedId = null
) => {
  try {
    const users = await User.find({ role }).select("_id");
    const userIds = users.map((user) => user._id);

    return await createMultipleNotifications(
      userIds,
      type,
      title,
      message,
      relatedId
    );
  } catch (error) {
    console.error(`Error creating notifications for ${role} users:`, error);
    throw error;
  }
};

/**
 * Create a system announcement for all users
 * @param {string} title - The announcement title
 * @param {string} message - The announcement message
 * @returns {Promise<Array>} - Array of created notification objects
 */
const createSystemAnnouncement = async (title, message) => {
  try {
    const users = await User.find().select("_id");
    const userIds = users.map((user) => user._id);

    return await createMultipleNotifications(userIds, "system", title, message);
  } catch (error) {
    console.error("Error creating system announcement:", error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createMultipleNotifications,
  notifyUsersByRole,
  createSystemAnnouncement,
};
