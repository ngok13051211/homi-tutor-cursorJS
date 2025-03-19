const User = require("./User");
const Role = require("./Role");
const TutorProfile = require("./TutorProfile");
const StudentProfile = require("./StudentProfile");
const Category = require("./Category");
const Course = require("./Course");
const Review = require("./Review");
const ChatSession = require("./ChatSession");
const Payment = require("./Payment");
const Notification = require("./Notification");
const { TutorAvailability, Session } = require("./scheduleModel");

module.exports = {
  User,
  Role,
  TutorProfile,
  StudentProfile,
  Category,
  Course,
  Review,
  ChatSession,
  Payment,
  Notification,
  TutorAvailability,
  Session,
};
