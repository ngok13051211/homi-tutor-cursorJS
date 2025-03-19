const { ChatSession, User, Notification } = require("../models");

/**
 * Get user's chat sessions
 * @route GET /api/chats
 * @access Private
 */
const getUserChatSessions = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all chat sessions where user is a participant
    const chatSessions = await ChatSession.find({
      participants: userId,
      isActive: true,
    })
      .populate({
        path: "participants",
        select: "name profilePicture role",
      })
      .populate({
        path: "course",
        select: "name",
      })
      .sort({ lastActivity: -1 });

    res.json(chatSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get chat session by ID
 * @route GET /api/chats/:id
 * @access Private
 */
const getChatSessionById = async (req, res) => {
  try {
    const chatSession = await ChatSession.findById(req.params.id)
      .populate({
        path: "participants",
        select: "name profilePicture role",
      })
      .populate({
        path: "course",
        select: "name",
      });

    if (!chatSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Check if user is a participant
    if (
      !chatSession.participants.some(
        (p) => p._id.toString() === req.user._id.toString()
      )
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this chat session" });
    }

    res.json(chatSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new chat session
 * @route POST /api/chats
 * @access Private
 */
const createChatSession = async (req, res) => {
  try {
    const { receiverId, courseId, initialMessage } = req.body;
    const senderId = req.user._id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Check if a chat session already exists between these users
    const existingChat = await ChatSession.findOne({
      participants: { $all: [senderId, receiverId] },
      course: courseId || { $exists: false },
      isActive: true,
    });

    if (existingChat) {
      // If chat exists, add new message
      if (initialMessage) {
        existingChat.messages.push({
          sender: senderId,
          content: initialMessage,
          timestamp: Date.now(),
        });
        existingChat.lastActivity = Date.now();
        await existingChat.save();
      }

      return res.json(existingChat);
    }

    // Create new chat session
    const chatSession = await ChatSession.create({
      participants: [senderId, receiverId],
      course: courseId || null,
      messages: initialMessage
        ? [
            {
              sender: senderId,
              content: initialMessage,
              timestamp: Date.now(),
            },
          ]
        : [],
      lastActivity: Date.now(),
    });

    // Create notification for the receiver
    await Notification.create({
      recipient: receiverId,
      type: "new_message",
      title: "New Message",
      message: `You have a new message from ${req.user.name}`,
      relatedItem: {
        itemType: "message",
        itemId: chatSession._id,
      },
    });

    res.status(201).json(chatSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Send a message in a chat session
 * @route POST /api/chats/:id/messages
 * @access Private
 */
const sendMessage = async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const chatSession = await ChatSession.findById(req.params.id);

    if (!chatSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Check if user is a participant
    if (!chatSession.participants.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to send messages in this chat" });
    }

    // Add new message
    const newMessage = {
      sender: req.user._id,
      content,
      timestamp: Date.now(),
      attachments: attachments || [],
    };

    chatSession.messages.push(newMessage);
    chatSession.lastActivity = Date.now();
    await chatSession.save();

    // Create notifications for other participants
    const otherParticipants = chatSession.participants.filter(
      (p) => p.toString() !== req.user._id.toString()
    );

    for (const participantId of otherParticipants) {
      await Notification.create({
        recipient: participantId,
        type: "new_message",
        title: "New Message",
        message: `New message from ${req.user.name}`,
        relatedItem: {
          itemType: "message",
          itemId: chatSession._id,
        },
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Mark messages as read
 * @route PUT /api/chats/:id/read
 * @access Private
 */
const markMessagesAsRead = async (req, res) => {
  try {
    const chatSession = await ChatSession.findById(req.params.id);

    if (!chatSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Check if user is a participant
    if (!chatSession.participants.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this chat" });
    }

    // Mark unread messages as read
    chatSession.messages.forEach((message) => {
      if (
        message.sender.toString() !== req.user._id.toString() &&
        !message.read
      ) {
        message.read = true;
      }
    });

    await chatSession.save();
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Deactivate (soft delete) a chat session
 * @route DELETE /api/chats/:id
 * @access Private
 */
const deactivateChatSession = async (req, res) => {
  try {
    const chatSession = await ChatSession.findById(req.params.id);

    if (!chatSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Check if user is a participant
    if (!chatSession.participants.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this chat" });
    }

    // Soft delete - set isActive to false
    chatSession.isActive = false;
    await chatSession.save();

    res.json({ message: "Chat session deactivated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserChatSessions,
  getChatSessionById,
  createChatSession,
  sendMessage,
  markMessagesAsRead,
  deactivateChatSession,
};
