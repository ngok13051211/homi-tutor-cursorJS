const jwt = require("jsonwebtoken");
const { User, StudentProfile, TutorProfile } = require("../models");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * Register a new user
 * @route POST /api/users/register
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
    });

    // Create profile based on role
    if (user.role === "student") {
      await StudentProfile.create({ user: user._id });
    } else if (user.role === "tutor") {
      // Create tutor profile with default values for required fields
      await TutorProfile.create({
        user: user._id,
        biography: "",
        experience: 0, // Default experience to 0 years
        hourlyRate: 20, // Default hourly rate
        subjects: [], // Empty array for subjects
        certifications: [], // Empty array for certifications
        rating: 0,
        reviewCount: 0,
      });
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          }))
        : null,
    });
  }
};

/**
 * Login user
 * @route POST /api/users/login
 * @access Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profile = null;
    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === "tutor") {
      profile = await TutorProfile.findOne({ user: user._id }).populate(
        "subjects"
      );
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user basic info
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;
    if (req.body.password) user.password = req.body.password;

    // Update role-specific profile
    if (user.role === "student" && req.body.studentProfile) {
      const studentProfile = await StudentProfile.findOne({
        user: user._id,
      });
      if (studentProfile) {
        // Update student profile fields
        if (req.body.studentProfile.grade !== undefined)
          studentProfile.grade = req.body.studentProfile.grade;
        if (req.body.studentProfile.school)
          studentProfile.school = req.body.studentProfile.school;
        if (req.body.studentProfile.interests)
          studentProfile.interests = req.body.studentProfile.interests;

        await studentProfile.save();
      }
    } else if (user.role === "tutor" && req.body.tutorProfile) {
      const tutorProfile = await TutorProfile.findOne({ user: user._id });

      if (tutorProfile) {
        // Update tutor profile fields
        const { biography, experience, hourlyRate, subjects, certifications } =
          req.body.tutorProfile;

        if (biography !== undefined) tutorProfile.biography = biography;
        if (experience !== undefined) tutorProfile.experience = experience;
        if (hourlyRate !== undefined) tutorProfile.hourlyRate = hourlyRate;
        if (subjects) tutorProfile.subjects = subjects;

        // Handle certifications update
        if (certifications && Array.isArray(certifications)) {
          // Validate each certification
          const validCertifications = certifications.filter(
            (cert) => cert.name && cert.issuer && cert.year
          );

          tutorProfile.certifications = validCertifications;
        }

        await tutorProfile.save();
      }
    }

    await user.save();

    // Return updated user info
    const updatedUser = await User.findById(user._id).select("-password");
    let profile = null;

    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === "tutor") {
      profile = await TutorProfile.findOne({ user: user._id }).populate(
        "subjects"
      );
    }

    res.json({
      ...updatedUser._doc,
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
