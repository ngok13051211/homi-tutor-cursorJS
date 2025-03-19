const { User, Course, TutorProfile, Category } = require("../models");

/**
 * Search for courses
 * @route GET /api/search/courses
 * @access Public
 */
const searchCourses = async (req, res) => {
  try {
    // Extract query parameters
    const {
      q,
      category,
      subject,
      priceMin,
      priceMax,
      format,
      sort = "rating",
      page = 1,
      limit = 10,
    } = req.query;

    // Build the filter object
    const filter = { status: "active" };

    // Search by keyword in name or description
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by subject
    if (subject) {
      filter.subject = { $regex: subject, $options: "i" };
    }

    // Filter by price range
    if (priceMin || priceMax) {
      filter.hourlyRate = {};
      if (priceMin) filter.hourlyRate.$gte = Number(priceMin);
      if (priceMax) filter.hourlyRate.$lte = Number(priceMax);
    }

    // Filter by learning format
    if (format) {
      filter.learningFormat = format;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Determine sort order
    let sortOption = {};
    switch (sort) {
      case "price_asc":
        sortOption = { hourlyRate: 1 };
        break;
      case "price_desc":
        sortOption = { hourlyRate: -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "rating":
      default:
        sortOption = { rating: -1 };
        break;
    }

    // Execute the query
    const courses = await Course.find(filter)
      .populate({
        path: "tutor",
        select: "name profilePicture",
      })
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Course.countDocuments(filter);

    res.json({
      courses,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Search for tutors
 * @route GET /api/search/tutors
 * @access Public
 */
const searchTutors = async (req, res) => {
  try {
    // Extract query parameters
    const {
      q,
      subject,
      experience,
      ratingMin,
      priceMin,
      priceMax,
      sort = "rating",
      page = 1,
      limit = 10,
    } = req.query;

    // First find tutor profiles based on criteria
    let profileFilter = {};

    // Filter by experience
    if (experience) {
      profileFilter.experience = { $gte: Number(experience) };
    }

    // Filter by minimum rating
    if (ratingMin) {
      profileFilter.rating = { $gte: Number(ratingMin) };
    }

    // Filter by price range
    if (priceMin || priceMax) {
      profileFilter.hourlyRate = {};
      if (priceMin) profileFilter.hourlyRate.$gte = Number(priceMin);
      if (priceMax) profileFilter.hourlyRate.$lte = Number(priceMax);
    }

    // Filter by subject
    if (subject) {
      // Find categories containing the subject
      const categories = await Category.find({
        "subjects.name": { $regex: subject, $options: "i" },
      });

      if (categories.length > 0) {
        const categoryIds = categories.map((cat) => cat._id);
        profileFilter.subjects = { $in: categoryIds };
      }
    }

    // Determine sort order
    let sortOption = {};
    switch (sort) {
      case "price_asc":
        sortOption = { hourlyRate: 1 };
        break;
      case "price_desc":
        sortOption = { hourlyRate: -1 };
        break;
      case "experience":
        sortOption = { experience: -1 };
        break;
      case "rating":
      default:
        sortOption = { rating: -1 };
        break;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Find tutor profiles
    const tutorProfiles = await TutorProfile.find(profileFilter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate("subjects");

    // Extract user IDs from tutor profiles
    const tutorUserIds = tutorProfiles.map((profile) => profile.user);

    // Find users by IDs
    let userFilter = { _id: { $in: tutorUserIds }, role: "tutor" };

    // Add keyword search if provided
    if (q) {
      userFilter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const tutorUsers = await User.find(userFilter).select(
      "_id name email profilePicture"
    );

    // Combine user data with tutor profiles
    const tutors = tutorProfiles.map((profile) => {
      const user = tutorUsers.find(
        (u) => u._id.toString() === profile.user.toString()
      );
      return {
        _id: user?._id,
        name: user?.name,
        email: user?.email,
        profilePicture: user?.profilePicture,
        biography: profile.biography,
        subjects: profile.subjects,
        experience: profile.experience,
        hourlyRate: profile.hourlyRate,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
      };
    });

    // Get total count for pagination
    const total = await TutorProfile.countDocuments(profileFilter);

    res.json({
      tutors,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchCourses,
  searchTutors,
};
