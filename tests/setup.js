/**
 * Test setup utilities
 */
const mongoose = require("mongoose");
const {
  User,
  Category,
  Course,
  Review,
  Payment,
  ChatSession,
  Notification,
} = require("../models");

/**
 * Connect to test database
 */
const connectDB = async () => {
  const url =
    process.env.MONGODB_URI || "mongodb://localhost:27017/homi-tutor-test";
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to test database");
};

/**
 * Clear all collections in the database
 */
const clearDatabase = async () => {
  const collections = [
    User,
    Category,
    Course,
    Review,
    Payment,
    ChatSession,
    Notification,
  ];

  for (const collection of collections) {
    if (collection) {
      await collection.deleteMany({});
    }
  }
  console.log("Database cleared");
};

/**
 * Disconnect from the database
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log("Disconnected from test database");
};

/**
 * Generate a MongoDB ObjectId
 */
const generateObjectId = () => new mongoose.Types.ObjectId();

module.exports = {
  connectDB,
  clearDatabase,
  disconnectDB,
  generateObjectId,
};
