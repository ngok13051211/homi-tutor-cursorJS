const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  learningGoals: {
    type: String,
  },
  favoriteSubjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  educationLevel: {
    type: String,
    enum: ["elementary", "middle_school", "high_school", "college", "other"],
  },
  grade: {
    type: Number,
    min: 1,
    max: 12,
  },
  parentName: {
    type: String,
  },
  parentContact: {
    type: String,
  },
});

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

module.exports = StudentProfile;
