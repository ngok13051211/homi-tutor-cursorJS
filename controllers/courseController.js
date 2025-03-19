const { Course, TutorProfile, User, Category } = require("../models");

/**
 * Get all courses
 * @route GET /api/courses
 * @access Public
 */
const getCourses = async (req, res) => {
  try {
    const { category, subject, tutor, format, minPrice, maxPrice } = req.query;

    // Build filter object
    const filter = { status: "active" };

    if (category) filter.category = category;
    if (subject) filter.subject = { $regex: subject, $options: "i" };
    if (tutor) filter.tutor = tutor;
    if (format) filter.learningFormat = format;
    if (minPrice) filter.hourlyRate = { $gte: Number(minPrice) };
    if (maxPrice) {
      filter.hourlyRate = { ...filter.hourlyRate, $lte: Number(maxPrice) };
    }

    // Get courses with pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const courses = await Course.find(filter)
      .populate({
        path: "tutor",
        select: "name profilePicture",
      })
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Course.countDocuments(filter);

    res.json({
      courses,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get course by ID
 * @route GET /api/courses/:id
 * @access Public
 */
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: "tutor",
        select: "name profilePicture",
      })
      .populate("category")
      .populate({
        path: "students",
        select: "name profilePicture",
      });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Get tutor profile for additional details
    const tutorProfile = await TutorProfile.findOne({ user: course.tutor._id });

    res.json({
      ...course._doc,
      tutorProfile: {
        biography: tutorProfile?.biography,
        experience: tutorProfile?.experience,
        rating: tutorProfile?.rating,
        reviewCount: tutorProfile?.reviewCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new course
 * @route POST /api/courses
 * @access Private (Tutors only)
 */
const createCourse = async (req, res) => {
  try {
    const {
      name,
      category,
      subject,
      description,
      hourlyRate,
      schedule,
      learningFormat,
      duration,
    } = req.body;

    // Verify the category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // Create the course
    const course = await Course.create({
      name,
      tutor: req.user._id,
      category,
      subject,
      description,
      hourlyRate,
      schedule,
      learningFormat,
      duration,
      students: [],
    });

    if (course) {
      res.status(201).json(course);
    } else {
      res.status(400).json({ message: "Invalid course data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update a course
 * @route PUT /api/courses/:id
 * @access Private (Course owner or Admin)
 */
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check ownership
    if (
      course.tutor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to update this course" });
    }

    const {
      name,
      category,
      subject,
      description,
      hourlyRate,
      schedule,
      learningFormat,
      duration,
      status,
    } = req.body;

    // Update fields
    if (name) course.name = name;
    if (category) course.category = category;
    if (subject) course.subject = subject;
    if (description) course.description = description;
    if (hourlyRate) course.hourlyRate = hourlyRate;
    if (schedule) course.schedule = schedule;
    if (learningFormat) course.learningFormat = learningFormat;
    if (duration) course.duration = duration;
    if (status) course.status = status;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a course
 * @route DELETE /api/courses/:id
 * @access Private (Course owner or Admin)
 */
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check ownership
    if (
      course.tutor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this course" });
    }

    await course.remove();
    res.json({ message: "Course removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Enroll in a course
 * @route POST /api/courses/:id/enroll
 * @access Private (Students only)
 */
const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if course is full or inactive
    if (course.status !== "active") {
      return res
        .status(400)
        .json({ message: "This course is not available for enrollment" });
    }

    // Check if user is already enrolled
    if (course.students.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You are already enrolled in this course" });
    }

    // Add student to the course
    course.students.push(req.user._id);

    // If course reaches capacity, mark as full
    if (course.students.length >= (course.capacity || 10)) {
      course.status = "full";
    }

    await course.save();
    res.json({ message: "Successfully enrolled in course", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
};
