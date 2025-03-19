const notificationService = require("../utils/notificationService");

/**
 * @desc    Book a session
 * @route   POST /api/schedule/sessions
 * @access  Private (Students only)
 */
const bookSession = asyncHandler(async (req, res) => {
  try {
    const { tutorId, startTime, endTime, topic, description } = req.body;

    // Validate required fields
    if (!tutorId || !startTime || !endTime || !topic) {
      return res.status(400).json({
        message: "Please provide tutorId, startTime, endTime, and topic",
      });
    }

    // Check if tutor exists
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== "tutor") {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // Check if tutor is available during that time
    const availability = await TutorAvailability.findOne({
      tutor: tutorId,
      startTime: { $lte: new Date(startTime) },
      endTime: { $gte: new Date(endTime) },
      isBooked: false,
    });

    if (!availability) {
      return res.status(400).json({
        message: "Tutor is not available during the requested time slot",
      });
    }

    // Create session
    const session = await Session.create({
      tutor: tutorId,
      student: req.user._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      topic,
      description,
      status: "scheduled",
    });

    // Update availability to be booked
    availability.isBooked = true;
    await availability.save();

    // Create notification for the student
    await notificationService.createNotification(
      req.user._id,
      "session",
      "Session Booked Successfully",
      `Your session on "${topic}" with ${
        tutor.name
      } has been scheduled for ${new Date(startTime).toLocaleString()}.`,
      session._id
    );

    // Create notification for the tutor
    await notificationService.createNotification(
      tutorId,
      "session",
      "New Session Booked",
      `${
        req.user.name
      } has booked a session with you on "${topic}" scheduled for ${new Date(
        startTime
      ).toLocaleString()}.`,
      session._id
    );

    res.status(201).json(session);
  } catch (error) {
    console.error("Error booking session:", error);
    res.status(500).json({ message: "Failed to book session" });
  }
});

/**
 * @desc    Update session status
 * @route   PUT /api/schedule/sessions/:id/status
 * @access  Private
 */
const updateSessionStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Validate that the user is either the tutor or the student
    if (
      req.user._id.toString() !== session.tutor.toString() &&
      req.user._id.toString() !== session.student.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to update this session",
      });
    }

    // Update status
    session.status = status;
    await session.save();

    // Create notifications based on status change
    const statusMessages = {
      completed: "has been completed successfully",
      cancelled: "has been cancelled",
      rescheduled: "has been rescheduled",
    };

    const statusMessage = statusMessages[status] || "has been updated";

    // Get user names
    const tutor = await User.findById(session.tutor);
    const student = await User.findById(session.student);

    // Notify student
    await notificationService.createNotification(
      session.student,
      "session",
      `Session ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your session on "${session.topic}" with ${tutor.name} ${statusMessage}.`,
      session._id
    );

    // Notify tutor
    await notificationService.createNotification(
      session.tutor,
      "session",
      `Session ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your session on "${session.topic}" with ${student.name} ${statusMessage}.`,
      session._id
    );

    res.json(session);
  } catch (error) {
    console.error("Error updating session status:", error);
    res.status(500).json({ message: "Failed to update session status" });
  }
});
