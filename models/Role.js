const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ["student", "tutor", "admin"],
  },
  permissions: [
    {
      type: String,
      enum: [
        "create_course",
        "edit_course",
        "delete_course",
        "book_lesson",
        "cancel_lesson",
        "leave_review",
        "manage_users",
        "manage_payments",
        "send_message",
      ],
    },
  ],
  description: {
    type: String,
    required: true,
  },
});

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
