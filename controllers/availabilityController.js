const { TutorAvailability, User } = require("../models");
const {
  validateTimeFormat,
  isEndTimeAfterStartTime,
} = require("../utils/timeUtils");

/**
 * @desc    Add tutor availability
 * @route   POST /api/availability
 * @access  Private (Tutors only)
 */
const addAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, isRecurring, date } = req.body;

    // Validate time format
    if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
      return res
        .status(400)
        .json({ message: "Invalid time format. Use HH:MM in 24-hour format." });
    }

    // Validate that end time is after start time
    if (!isEndTimeAfterStartTime(startTime, endTime)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time." });
    }

    // Validate day of week
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res
        .status(400)
        .json({
          message: "Day of week must be between 0 (Sunday) and 6 (Saturday).",
        });
    }

    // Check if user is a tutor
    const user = await User.findById(req.user.id);
    if (user.role !== "tutor") {
      return res
        .status(403)
        .json({ message: "Only tutors can add availability." });
    }

    // Create availability
    const availability = new TutorAvailability({
      tutor: req.user.id,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring,
      ...(isRecurring === false && { date }),
    });

    await availability.save();

    res.status(201).json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get tutor's availability
 * @route   GET /api/availability
 * @access  Private (Tutors only)
 */
const getMyAvailability = async (req, res) => {
  try {
    // Check if user is a tutor
    const user = await User.findById(req.user.id);
    if (user.role !== "tutor") {
      return res
        .status(403)
        .json({ message: "Only tutors can access their availability." });
    }

    const availability = await TutorAvailability.find({ tutor: req.user.id });
    res.status(200).json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get specific tutor's availability (for students to see when booking)
 * @route   GET /api/availability/:tutorId
 * @access  Public
 */
const getTutorAvailability = async (req, res) => {
  try {
    const { tutorId } = req.params;

    // Check if user exists and is a tutor
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== "tutor") {
      return res.status(404).json({ message: "Tutor not found." });
    }

    const availability = await TutorAvailability.find({ tutor: tutorId });
    res.status(200).json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Update tutor availability
 * @route   PUT /api/availability/:id
 * @access  Private (Tutors only)
 */
const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, isRecurring, date } = req.body;

    // Find availability
    const availability = await TutorAvailability.findById(id);

    if (!availability) {
      return res.status(404).json({ message: "Availability not found." });
    }

    // Check if user is the tutor who created the availability
    if (availability.tutor.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this availability." });
    }

    // Validate time format
    if (
      (startTime && !validateTimeFormat(startTime)) ||
      (endTime && !validateTimeFormat(endTime))
    ) {
      return res
        .status(400)
        .json({ message: "Invalid time format. Use HH:MM in 24-hour format." });
    }

    // Validate that end time is after start time
    const newStartTime = startTime || availability.startTime;
    const newEndTime = endTime || availability.endTime;
    if (!isEndTimeAfterStartTime(newStartTime, newEndTime)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time." });
    }

    // Update availability
    if (dayOfWeek !== undefined) availability.dayOfWeek = dayOfWeek;
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;
    if (isRecurring !== undefined) availability.isRecurring = isRecurring;
    if (date && !isRecurring) availability.date = date;

    await availability.save();

    res.status(200).json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Delete tutor availability
 * @route   DELETE /api/availability/:id
 * @access  Private (Tutors only)
 */
const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    // Find availability
    const availability = await TutorAvailability.findById(id);

    if (!availability) {
      return res.status(404).json({ message: "Availability not found." });
    }

    // Check if user is the tutor who created the availability
    if (availability.tutor.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this availability." });
    }

    await availability.remove();

    res.status(200).json({ message: "Availability removed." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get tutor's available time slots for a specific date
 * @route   GET /api/availability/slots/:tutorId/:date
 * @access  Public
 */
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { tutorId, date } = req.params;

    // Check if user exists and is a tutor
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== "tutor") {
      return res.status(404).json({ message: "Tutor not found." });
    }

    // Parse the date
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    const dayOfWeek = selectedDate.getDay();

    // Get recurring availability for the day of week
    const recurringAvailability = await TutorAvailability.find({
      tutor: tutorId,
      dayOfWeek,
      isRecurring: true,
    });

    // Get specific date availability
    const specificAvailability = await TutorAvailability.find({
      tutor: tutorId,
      date: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lte: new Date(selectedDate.setHours(23, 59, 59, 999)),
      },
      isRecurring: false,
    });

    // Combine availabilities
    const allAvailability = [...recurringAvailability, ...specificAvailability];

    // Format as time slots (e.g., 30-minute increments)
    const timeSlots = [];

    allAvailability.forEach((slot) => {
      const [startHour, startMinute] = slot.startTime.split(":").map(Number);
      const [endHour, endMinute] = slot.endTime.split(":").map(Number);

      // Calculate start and end in minutes since midnight
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Create 30-minute slots
      for (let time = startMinutes; time < endMinutes; time += 30) {
        const slotHour = Math.floor(time / 60);
        const slotMinute = time % 60;

        timeSlots.push({
          time: `${slotHour.toString().padStart(2, "0")}:${slotMinute
            .toString()
            .padStart(2, "0")}`,
          available: true, // We'll check for conflicts next
        });
      }
    });

    // Check for booked sessions
    const bookedSessions = await Session.find({
      tutor: tutorId,
      status: { $in: ["pending", "confirmed"] },
      startTime: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lte: new Date(selectedDate.setHours(23, 59, 59, 999)),
      },
    });

    // Mark booked slots as unavailable
    bookedSessions.forEach((session) => {
      const sessionStart = new Date(session.startTime);
      const sessionEnd = new Date(session.endTime);

      timeSlots.forEach((slot) => {
        const [slotHour, slotMinute] = slot.time.split(":").map(Number);
        const slotStart = new Date(
          selectedDate.setHours(slotHour, slotMinute, 0, 0)
        );
        const slotEnd = new Date(
          new Date(slotStart).setMinutes(slotStart.getMinutes() + 30)
        );

        // Check if this slot overlaps with the booked session
        if (
          (slotStart >= sessionStart && slotStart < sessionEnd) ||
          (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
          (slotStart <= sessionStart && slotEnd >= sessionEnd)
        ) {
          slot.available = false;
        }
      });
    });

    // Sort slots by time
    timeSlots.sort((a, b) => {
      const [aHour, aMinute] = a.time.split(":").map(Number);
      const [bHour, bMinute] = b.time.split(":").map(Number);

      if (aHour !== bHour) return aHour - bHour;
      return aMinute - bMinute;
    });

    res.status(200).json(timeSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addAvailability,
  getMyAvailability,
  getTutorAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailableTimeSlots,
};
