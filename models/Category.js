const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "elementary_school",
      "middle_school",
      "high_school",
      "foreign_languages",
    ],
  },
  grade: {
    type: Number,
    min: 1,
    max: 12,
  },
  description: {
    type: String,
  },
  subjects: [
    {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
    },
  ],
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
