const mongoose = require("mongoose");

// Schema for tutor availability
const availabilitySchema = new mongoose.Schema({
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dayOfWeek: {
    type: Number, // 0-6 (Sunday-Saturday)
    required: true,
    min: 0,
    max: 6,
  },
  startTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true,
  },
  endTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true,
  },
  isRecurring: {
    type: Boolean,
    default: true,
  },
  date: {
    type: Date, // Only used for non-recurring availability
    required: function () {
      return !this.isRecurring;
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Schema for booking sessions
const sessionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  notes: {
    type: String,
    trim: true,
  },
  meetingLink: {
    type: String,
    trim: true,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual field for session duration in minutes
sessionSchema.virtual("durationMinutes").get(function () {
  return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Middleware to update 'updatedAt' on save
sessionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check for session conflicts
sessionSchema.statics.checkConflict = async function (
  tutorId,
  startTime,
  endTime,
  excludeSessionId = null
) {
  const query = {
    tutor: tutorId,
    status: { $in: ["pending", "confirmed"] },
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
    ],
  };

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const conflictingSessions = await this.find(query);
  return conflictingSessions.length > 0;
};

// Check if a given time falls within tutor's availability
availabilitySchema.statics.isTimeAvailable = async function (
  tutorId,
  startTime,
  endTime
) {
  const startDate = new Date(startTime);
  const dayOfWeek = startDate.getDay();

  const startHours = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const timeString = `${startHours.toString().padStart(2, "0")}:${startMinutes
    .toString()
    .padStart(2, "0")}`;

  // Check recurring availability for the day of week
  const availability = await this.findOne({
    tutor: tutorId,
    dayOfWeek: dayOfWeek,
    startTime: { $lte: timeString },
    endTime: { $gte: timeString },
    isRecurring: true,
  });

  if (availability) {
    return true;
  }

  // Check specific date availability
  const specificAvailability = await this.findOne({
    tutor: tutorId,
    date: {
      $gte: new Date(startDate.setHours(0, 0, 0, 0)),
      $lte: new Date(startDate.setHours(23, 59, 59, 999)),
    },
    startTime: { $lte: timeString },
    endTime: { $gte: timeString },
    isRecurring: false,
  });

  return !!specificAvailability;
};

const TutorAvailability = mongoose.model(
  "TutorAvailability",
  availabilitySchema
);
const Session = mongoose.model("Session", sessionSchema);

module.exports = { TutorAvailability, Session };
