const express = require("express");
const {
  getUserChatSessions,
  getChatSessionById,
  createChatSession,
  sendMessage,
  markMessagesAsRead,
  deactivateChatSession,
} = require("../controllers/chatController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// All routes are private and require authentication
router.use(auth);

// Get user's chat sessions
router.get("/", getUserChatSessions);

// Get specific chat session
router.get("/:id", getChatSessionById);

// Create new chat session
router.post("/", createChatSession);

// Send a message in a chat session
router.post("/:id/messages", sendMessage);

// Mark messages as read
router.put("/:id/read", markMessagesAsRead);

// Deactivate (soft delete) a chat session
router.delete("/:id", deactivateChatSession);

module.exports = router;
