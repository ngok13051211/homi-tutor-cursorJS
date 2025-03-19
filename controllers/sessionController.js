const {
  Session,
  TutorAvailability,
  User,
  Course,
  Notification,
} = require("../models");
const {
  validateTimeFormat,
  dateTimeToDate,
  doPeriodsOverlap,
} = require("../utils/timeUtils");

/**
 * @desc    Book a session with a tutor
 * @route   POST /api/sessions
 * @access  Private (Students only)
 */
const bookSession = async (req, res) => {
  try {
    const { courseId, startDate, startTime, endTime } = req.body;

    // Validate time format
    if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
      return res
        .status(400)
        .json({ message: "Invalid time format. Use HH:MM in 24-hour format." });
    }

    // Check if user is a student
    const student = await User.findById(req.user.id);
    if (student.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can book sessions." });
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Get the tutor from the course
    const tutorId = course.tutor;

    // Convert date and time strings to Date objects
    const sessionStartTime = dateTimeToDate(startDate, startTime);
    const sessionEndTime = dateTimeToDate(startDate, endTime);

    // Check if the session is in the future
    if (sessionStartTime <= new Date()) {
      return res
        .status(400)
        .json({ message: "Session must be scheduled for the future." });
    }

    // Check if the session falls within tutor's availability
    const isAvailable = await TutorAvailability.isTimeAvailable(
      tutorId,
      sessionStartTime,
      sessionEndTime
    );
    if (!isAvailable) {
      return res
        .status(400)
        .json({
          message:
            "The selected time is not within the tutor's available hours.",
        });
    }

    // Check for session conflicts
    const hasConflict = await Session.checkConflict(
      tutorId,
      sessionStartTime,
      sessionEndTime
    );
    if (hasConflict) {
      return res
        .status(400)
        .json({ message: "The selected time conflicts with another booking." });
    }

    // Create the session
    const session = new Session({
      course: courseId,
      tutor: tutorId,
      student: req.user.id,
      startTime: sessionStartTime,
      endTime: sessionEndTime,
      status: "pending",
    });

    await session.save();

    // Create a notification for the tutor
    const notification = new Notification({
      recipient: tutorId,
      type: "session_request",
      title: "New Session Request",
      message: `You have a new session request for ${course.name} on ${startDate} at ${startTime}.`,
      relatedItem: {
        itemType: "session",
        itemId: session._id,
      },
    });

    await notification.save();

    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get all sessions for the logged-in user (tutor or student)
 * @route   GET /api/sessions
 * @access  Private
 */
const getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let query;
    if (user.role === "tutor") {
      query = { tutor: userId };
    } else if (user.role === "student") {
      query = { student: userId };
    } else {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    // Add filters from query parameters
    const { status, from, to } = req.query;

    if (status) {
      query.status = status;
    }

    if (from || to) {
      query.startTime = {};
      if (from) {
        query.startTime.$gte = new Date(from);
      }
      if (to) {
        query.startTime.$lte = new Date(to);
      }
    }

    const sessions = await Session.find(query)
      .populate("course", "name description hourlyRate")
      .populate("tutor", "name email")
      .populate("student", "name email")
      .sort({ startTime: 1 });

    res.status(200).json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get a session by ID
 * @route   GET /api/sessions/:id
 * @access  Private
 */
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await Session.findById(id)
      .populate("course", "name description hourlyRate")
      .populate("tutor", "name email")
      .populate("student", "name email");

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    // Check if user is the tutor or student of the session
    if (
      session.tutor._id.toString() !== userId &&
      session.student._id.toString() !== userId
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this session." });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Update session status (confirm, cancel, complete)
 * @route   PUT /api/sessions/:id/status
 * @access  Private
 */
const updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, meetingLink } = req.body;
    const userId = req.user.id;

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    // Get user role
    const user = await User.findById(userId);

    // Check permissions based on the requested status change
    if (status === "confirmed") {
      // Only tutors can confirm sessions
      if (session.tutor.toString() !== userId || user.role !== "tutor") {
        return res
          .status(403)
          .json({ message: "Only tutors can confirm sessions." });
      }
    } else if (status === "completed") {
      // Only tutors can mark sessions as completed
      if (session.tutor.toString() !== userId || user.role !== "tutor") {
        return res
          .status(403)
          .json({ message: "Only tutors can mark sessions as completed." });
      }

      // Check if the session end time has passed
      if (new Date(session.endTime) > new Date()) {
        return res
          .status(400)
          .json({ message: "Cannot mark a future session as completed." });
      }
    } else if (status === "cancelled") {
      // Both tutor and student can cancel their own sessions
      if (
        session.tutor.toString() !== userId &&
        session.student.toString() !== userId
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to cancel this session." });
      }

      // Check if the session is already completed
      if (session.status === "completed") {
        return res
          .status(400)
          .json({ message: "Cannot cancel a completed session." });
      }
    }

    // Update session status
    session.status = status;

    // Update meeting link if provided
    if (meetingLink) {
      session.meetingLink = meetingLink;
    }

    await session.save();

    // Create notification for status change
    let notificationRecipient;
    let notificationTitle;
    let notificationMessage;

    if (session.tutor.toString() === userId) {
      notificationRecipient = session.student;
    } else {
      notificationRecipient = session.tutor;
    }

    const course = await Course.findById(session.course);

    if (status === "confirmed") {
      notificationTitle = "Session Confirmed";
      notificationMessage = `Your session for ${course.name} has been confirmed by the tutor.`;
    } else if (status === "cancelled") {
      const canceler = user.role === "tutor" ? "tutor" : "student";
      notificationTitle = "Session Cancelled";
      notificationMessage = `Your session for ${course.name} has been cancelled by the ${canceler}.`;
    } else if (status === "completed") {
      notificationTitle = "Session Completed";
      notificationMessage = `Your session for ${course.name} has been marked as completed. Please provide feedback.`;
    }

    const notification = new Notification({
      recipient: notificationRecipient,
      type: "session_update",
      title: notificationTitle,
      message: notificationMessage,
      relatedItem: {
        itemType: "session",
        itemId: session._id,
      },
    });

    await notification.save();

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Submit feedback for a completed session
 * @route   POST /api/sessions/:id/feedback
 * @access  Private (Students only)
 */
const submitSessionFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5." });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    // Check if user is the student of the session
    if (session.student.toString() !== userId) {
      return res
        .status(403)
        .json({
          message: "Only the student can submit feedback for a session.",
        });
    }

    // Check if session is completed
    if (session.status !== "completed") {
      return res
        .status(400)
        .json({
          message: "Feedback can only be submitted for completed sessions.",
        });
    }

    // Check if feedback has already been submitted
    if (session.feedback && session.feedback.submittedAt) {
      return res
        .status(400)
        .json({
          message: "Feedback has already been submitted for this session.",
        });
    }

    // Update session with feedback
    session.feedback = {
      rating,
      comment,
      submittedAt: Date.now(),
    };

    await session.save();

    // Create notification for the tutor
    const notification = new Notification({
      recipient: session.tutor,
      type: "session_feedback",
      title: "Session Feedback Received",
      message: `You've received feedback for your session.`,
      relatedItem: {
        itemType: "session",
        itemId: session._id,
      },
    });

    await notification.save();

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Add notes to a session
 * @route   PUT /api/sessions/:id/notes
 * @access  Private
 */
const addSessionNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    if (!notes) {
      return res.status(400).json({ message: "Notes are required." });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    // Check if user is the tutor or student of the session
    if (
      session.tutor.toString() !== userId &&
      session.student.toString() !== userId
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this session." });
    }

    // Update session with notes
    session.notes = notes;
    await session.save();

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Send reminder notification for upcoming sessions
 * @route   None (called by scheduler or cron job)
 * @access  Private
 */
const sendSessionReminders = async () => {
  try {
    // Find sessions starting in the next 24 hours that haven't had reminders sent
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(now.getHours() + 24);

    const upcomingSessions = await Session.find({
      status: "confirmed",
      startTime: { $gt: now, $lt: tomorrow },
      reminderSent: false,
    })
      .populate("course", "name")
      .populate("tutor", "name")
      .populate("student", "name");

    // Send reminder notifications
    for (const session of upcomingSessions) {
      // Create notification for the student
      const studentNotification = new Notification({
        recipient: session.student._id,
        type: "session_reminder",
        title: "Upcoming Session Reminder",
        message: `Your session for ${session.course.name} with ${session.tutor.name} is scheduled in less than 24 hours.`,
        relatedItem: {
          itemType: "session",
          itemId: session._id,
        },
      });

      await studentNotification.save();

      // Create notification for the tutor
      const tutorNotification = new Notification({
        recipient: session.tutor._id,
        type: "session_reminder",
        title: "Upcoming Session Reminder",
        message: `Your session for ${session.course.name} with ${session.student.name} is scheduled in less than 24 hours.`,
        relatedItem: {
          itemType: "session",
          itemId: session._id,
        },
      });

      await tutorNotification.save();

      // Mark reminder as sent
      session.reminderSent = true;
      await session.save();
    }

    return {
      success: true,
      count: upcomingSessions.length,
      message: `Sent ${upcomingSessions.length} session reminders.`,
    };
  } catch (error) {
    console.error("Error sending session reminders:", error);
    return { success: false, error: error.message };
  }
};

/**
 * @desc    API endpoint to send reminders manually (for testing)
 * @route   POST /api/sessions/send-reminders
 * @access  Private (Admin only)
 */
const sendRemindersEndpoint = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is an admin
    const user = await User.findById(userId);
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can trigger reminders manually." });
    }

    const result = await sendSessionReminders();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  bookSession,
  getMySessions,
  getSessionById,
  updateSessionStatus,
  submitSessionFeedback,
  addSessionNotes,
  sendSessionReminders,
  sendRemindersEndpoint,
};
