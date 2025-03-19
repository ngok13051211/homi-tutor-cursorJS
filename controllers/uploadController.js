const { User, TutorProfile } = require("../models");
const fs = require("fs");
const path = require("path");

/**
 * Upload profile picture
 * @route POST /api/upload/profile-picture
 * @access Private
 */
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get file path
    const filePath = req.file.path.replace(/\\/g, "/"); // Replace backslashes with forward slashes

    // Update user's profile picture
    const user = await User.findById(req.user._id);

    // Delete old profile picture if it exists
    if (
      user.profilePicture &&
      user.profilePicture.startsWith("uploads/") &&
      fs.existsSync(user.profilePicture)
    ) {
      fs.unlinkSync(user.profilePicture);
    }

    user.profilePicture = filePath;
    await user.save();

    res.json({
      message: "Profile picture uploaded successfully",
      profilePicture: filePath,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Upload certification document
 * @route POST /api/upload/certification
 * @access Private (Tutors only)
 */
const uploadCertification = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get file path
    const filePath = req.file.path.replace(/\\/g, "/");

    // Get certification details from request body
    const { name, issuer, year } = req.body;

    if (!name || !issuer || !year) {
      return res
        .status(400)
        .json({
          message:
            "Please provide name, issuer, and year for the certification",
        });
    }

    // Find tutor profile
    const tutorProfile = await TutorProfile.findOne({ user: req.user._id });

    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // Add certification to tutor profile
    tutorProfile.certifications.push({
      name,
      issuer,
      year: Number(year),
      documentUrl: filePath,
    });

    await tutorProfile.save();

    res.status(201).json({
      message: "Certification uploaded successfully",
      certification:
        tutorProfile.certifications[tutorProfile.certifications.length - 1],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete certification
 * @route DELETE /api/upload/certification/:id
 * @access Private (Tutors only)
 */
const deleteCertification = async (req, res) => {
  try {
    const certificationId = req.params.id;

    // Find tutor profile
    const tutorProfile = await TutorProfile.findOne({ user: req.user._id });

    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // Find certification
    const certification = tutorProfile.certifications.id(certificationId);

    if (!certification) {
      return res.status(404).json({ message: "Certification not found" });
    }

    // Delete file if it exists
    if (
      certification.documentUrl &&
      certification.documentUrl.startsWith("uploads/") &&
      fs.existsSync(certification.documentUrl)
    ) {
      fs.unlinkSync(certification.documentUrl);
    }

    // Remove certification from array
    tutorProfile.certifications.pull(certificationId);
    await tutorProfile.save();

    res.json({ message: "Certification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadProfilePicture,
  uploadCertification,
  deleteCertification,
};
