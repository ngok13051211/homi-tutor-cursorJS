const mongoose = require("mongoose");

const tutorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  biography: {
    type: String,
    required: false,
    default: "",
  },
  subjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  experience: {
    type: Number, // Years of experience
    required: true,
    min: 0,
  },
  certifications: [
    {
      name: {
        type: String,
        required: true,
      },
      issuer: {
        type: String,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      },
      documentUrl: {
        type: String,
      },
    },
  ],
  hourlyRate: {
    type: Number,
    required: true,
    min: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
});

const TutorProfile = mongoose.model("TutorProfile", tutorProfileSchema);

module.exports = TutorProfile;
