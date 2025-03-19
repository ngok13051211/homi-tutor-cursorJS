const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const searchRoutes = require("./routes/searchRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const { startReminderScheduler } = require("./utils/scheduler");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/homi-tutor", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");

    // Start reminder scheduler after database connection is established
    // Check for reminders every 2 hours
    startReminderScheduler(2);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Basic routes
app.get("/", function (req, res) {
  res.send("Homi-Tutor API is running.....");
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/sessions", sessionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
