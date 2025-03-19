const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "new_review",
      "upcoming_lesson",
      "payment_received",
      "payment_due",
      "course_update",
      "new_message",
      "system_announcement",
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedItem: {
    itemType: {
      type: String,
      enum: ["course", "review", "payment", "message", "user"],
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for frequent queries
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
