const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  attachments: [
    {
      type: String, // URLs to any attached files
    },
  ],
});

const chatSessionSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [messageSchema],
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Create compound index for faster querying of chats by participants
chatSessionSchema.index({ participants: 1 });

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

module.exports = ChatSession;
