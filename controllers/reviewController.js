const { Review, Course, TutorProfile } = require("../models");

/**
 * Get reviews for a tutor
 * @route GET /api/reviews/tutor/:tutorId
 * @access Public
 */
const getTutorReviews = async (req, res) => {
  try {
    const tutorId = req.params.tutorId;

    const reviews = await Review.find({ tutor: tutorId })
      .populate({
        path: "student",
        select: "name profilePicture",
      })
      .populate({
        path: "course",
        select: "name",
      })
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get reviews for a course
 * @route GET /api/reviews/course/:courseId
 * @access Public
 */
const getCourseReviews = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const reviews = await Review.find({ course: courseId })
      .populate({
        path: "student",
        select: "name profilePicture",
      })
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new review
 * @route POST /api/reviews
 * @access Private (Students only)
 */
const createReview = async (req, res) => {
  try {
    const { tutor, course, rating, comment } = req.body;

    // Check if student has already reviewed this tutor/course
    const existingReview = await Review.findOne({
      student: req.user._id,
      tutor,
      course,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this tutor/course" });
    }

    // Create the review
    const review = await Review.create({
      student: req.user._id,
      tutor,
      course,
      rating,
      comment,
    });

    // Update tutor's average rating
    if (review) {
      // Get all reviews for this tutor
      const tutorReviews = await Review.find({ tutor });

      // Calculate average rating
      const totalRating = tutorReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / tutorReviews.length;

      // Update tutor profile
      const tutorProfile = await TutorProfile.findOne({ user: tutor });
      if (tutorProfile) {
        tutorProfile.rating = averageRating;
        tutorProfile.reviewCount = tutorReviews.length;
        await tutorProfile.save();
      }

      // If course is provided, update course rating as well
      if (course) {
        const courseReviews = await Review.find({ course });
        const courseTotalRating = courseReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const courseAverageRating = courseTotalRating / courseReviews.length;

        const courseDoc = await Course.findById(course);
        if (courseDoc) {
          courseDoc.rating = courseAverageRating;
          courseDoc.reviewCount = courseReviews.length;
          await courseDoc.save();
        }
      }

      res.status(201).json(review);
    } else {
      res.status(400).json({ message: "Invalid review data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update a review
 * @route PUT /api/reviews/:id
 * @access Private (Review owner or Admin)
 */
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (
      review.student.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to update this review" });
    }

    const { rating, comment } = req.body;

    // Update fields
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    const updatedReview = await review.save();

    // Update tutor's average rating
    const tutorReviews = await Review.find({ tutor: review.tutor });
    const totalRating = tutorReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating = totalRating / tutorReviews.length;

    // Update tutor profile
    const tutorProfile = await TutorProfile.findOne({ user: review.tutor });
    if (tutorProfile) {
      tutorProfile.rating = averageRating;
      await tutorProfile.save();
    }

    // If review has a course, update course rating
    if (review.course) {
      const courseReviews = await Review.find({ course: review.course });
      const courseTotalRating = courseReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const courseAverageRating = courseTotalRating / courseReviews.length;

      const course = await Course.findById(review.course);
      if (course) {
        course.rating = courseAverageRating;
        await course.save();
      }
    }

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a review
 * @route DELETE /api/reviews/:id
 * @access Private (Review owner or Admin)
 */
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (
      review.student.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this review" });
    }

    // Store tutor and course IDs before deleting
    const { tutor, course } = review;

    await review.remove();

    // Update tutor's average rating
    const tutorReviews = await Review.find({ tutor });

    if (tutorReviews.length > 0) {
      const totalRating = tutorReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / tutorReviews.length;

      const tutorProfile = await TutorProfile.findOne({ user: tutor });
      if (tutorProfile) {
        tutorProfile.rating = averageRating;
        tutorProfile.reviewCount = tutorReviews.length;
        await tutorProfile.save();
      }
    }

    // If review had a course, update course rating
    if (course) {
      const courseReviews = await Review.find({ course });

      if (courseReviews.length > 0) {
        const courseTotalRating = courseReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const courseAverageRating = courseTotalRating / courseReviews.length;

        const courseDoc = await Course.findById(course);
        if (courseDoc) {
          courseDoc.rating = courseAverageRating;
          courseDoc.reviewCount = courseReviews.length;
          await courseDoc.save();
        }
      }
    }

    res.json({ message: "Review removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTutorReviews,
  getCourseReviews,
  createReview,
  updateReview,
  deleteReview,
};
