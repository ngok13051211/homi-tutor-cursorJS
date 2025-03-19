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
      await TutorProfile.create({
        user: user._id,
        biography: "",
        experience: 0,
        hourlyRate: 0,
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
    res.status(500).json({ message: error.message });
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

    const updatedUser = await user.save();

    // Update role-specific profile
    if (user.role === "student" && req.body.studentProfile) {
      const studentProfile = await StudentProfile.findOne({ user: user._id });

      if (studentProfile) {
        const {
          learningGoals,
          educationLevel,
          grade,
          parentName,
          parentContact,
        } = req.body.studentProfile;

        if (learningGoals) studentProfile.learningGoals = learningGoals;
        if (educationLevel) studentProfile.educationLevel = educationLevel;
        if (grade) studentProfile.grade = grade;
        if (parentName) studentProfile.parentName = parentName;
        if (parentContact) studentProfile.parentContact = parentContact;

        await studentProfile.save();
      }
    } else if (user.role === "tutor" && req.body.tutorProfile) {
      const tutorProfile = await TutorProfile.findOne({ user: user._id });

      if (tutorProfile) {
        const { biography, experience, hourlyRate, certifications } =
          req.body.tutorProfile;

        if (biography) tutorProfile.biography = biography;
        if (experience) tutorProfile.experience = experience;
        if (hourlyRate) tutorProfile.hourlyRate = hourlyRate;
        if (certifications) tutorProfile.certifications = certifications;

        await tutorProfile.save();
      }
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
