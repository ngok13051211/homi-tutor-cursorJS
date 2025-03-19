const express = require("express");
const {
  uploadProfilePicture,
  uploadCertification,
  deleteCertification,
} = require("../controllers/uploadController");
const { auth, checkRole } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Ensure upload directories exist
const createUploadDirectories = () => {
  const dirs = ["uploads", "uploads/images", "uploads/documents"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Create directories on startup
createUploadDirectories();

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "uploads/";

    // Determine upload folder based on file type
    if (file.mimetype.startsWith("image/")) {
      uploadPath += "images/";
    } else {
      uploadPath += "documents/";
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp + userId + original extension
    const uniqueSuffix = Date.now() + "-" + req.user._id;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;

  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Error: Unsupported file format! Only images (jpeg, jpg, png, gif) and documents (pdf, doc, docx) are allowed."
      )
    );
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: fileFilter,
});

// Add auth middleware to all routes
router.use(auth);

// Upload profile picture - images only
router.post(
  "/profile-picture",
  (req, res, next) => {
    upload.single("profilePicture")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: `Multer error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadProfilePicture
);

// Upload certification - tutors only
router.post(
  "/certification",
  checkRole(["tutor", "admin"]),
  (req, res, next) => {
    upload.single("certification")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: `Multer error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadCertification
);

// Delete certification - tutors only
router.delete(
  "/certification/:id",
  checkRole(["tutor", "admin"]),
  deleteCertification
);

// Serve static files from uploads directory
router.use("/files", express.static("uploads"));

module.exports = router;
