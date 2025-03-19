const request = require("supertest");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const app = require("../index");
const { User } = require("../models");

// Mock data
const mockUser = {
  name: "Upload Test User",
  email: "upload.test@example.com",
  password: "password123",
  role: "tutor",
};

let userToken;
let userId;
let testImagePath;
let testDocPath;

// Helper function to create a test file
const createTestFile = (filename, content, type) => {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
};

// Connect to a test database before all tests
beforeAll(async () => {
  const url =
    process.env.MONGODB_URI || "mongodb://localhost:27017/homi-tutor-test";
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Register user
  const userResponse = await request(app)
    .post("/api/users/register")
    .send(mockUser);
  userToken = userResponse.body.token;
  userId = userResponse.body.user._id;

  // Create test files
  testImagePath = createTestFile(
    "test-image.jpg",
    "test image content",
    "image/jpeg"
  );
  testDocPath = createTestFile(
    "test-doc.pdf",
    "test document content",
    "application/pdf"
  );
});

// Clear the database and files after all tests
afterAll(async () => {
  await User.deleteMany({});

  // Delete test files
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }
  if (fs.existsSync(testDocPath)) {
    fs.unlinkSync(testDocPath);
  }

  // Clean up uploaded files
  const uploadsDir = path.join(__dirname, "../uploads");
  if (fs.existsSync(uploadsDir)) {
    fs.readdirSync(uploadsDir).forEach((file) => {
      if (file !== ".gitkeep") {
        // Don't delete .gitkeep file
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    });
  }

  await mongoose.connection.close();
});

describe("Upload API", () => {
  describe("POST /api/upload/profile-picture", () => {
    test("should upload a profile picture with valid token", async () => {
      const response = await request(app)
        .post("/api/upload/profile-picture")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("image", testImagePath)
        .expect(200);

      expect(response.body).toHaveProperty("url");
      expect(response.body.url).toContain("/uploads/");
    });

    test("should not upload a profile picture without authentication", async () => {
      const response = await request(app)
        .post("/api/upload/profile-picture")
        .attach("image", testImagePath)
        .expect(401);

      expect(response.body.message).toContain("authentication");
    });

    test("should not upload a non-image file", async () => {
      const response = await request(app)
        .post("/api/upload/profile-picture")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("image", testDocPath)
        .expect(400);

      expect(response.body.message).toContain("file type");
    });
  });

  describe("POST /api/upload/certification", () => {
    test("should upload a certification document with valid token", async () => {
      const response = await request(app)
        .post("/api/upload/certification")
        .set("Authorization", `Bearer ${userToken}`)
        .field("name", "Test Certification")
        .field("description", "Test certification description")
        .attach("document", testDocPath)
        .expect(200);

      expect(response.body).toHaveProperty("certification");
      expect(response.body.certification).toHaveProperty("url");
      expect(response.body.certification.url).toContain("/uploads/");
      expect(response.body.certification.name).toBe("Test Certification");
    });

    test("should not upload a certification without authentication", async () => {
      const response = await request(app)
        .post("/api/upload/certification")
        .field("name", "Test Certification")
        .field("description", "Test certification description")
        .attach("document", testDocPath)
        .expect(401);

      expect(response.body.message).toContain("authentication");
    });

    test("should not upload without required fields", async () => {
      const response = await request(app)
        .post("/api/upload/certification")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("document", testDocPath)
        .expect(400);

      expect(response.body.message).toContain("required");
    });
  });

  // Note: We need an existing certification to test the delete endpoint
  describe("DELETE /api/upload/certification/:id", () => {
    let certificationId;

    beforeAll(async () => {
      // Upload a certification first
      const uploadResponse = await request(app)
        .post("/api/upload/certification")
        .set("Authorization", `Bearer ${userToken}`)
        .field("name", "Test Certification for Deletion")
        .field("description", "This certification will be deleted")
        .attach("document", testDocPath);

      certificationId = uploadResponse.body.certification._id;
    });

    test("should delete a certification with valid token and ID", async () => {
      const response = await request(app)
        .delete(`/api/upload/certification/${certificationId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toContain("successfully deleted");
    });

    test("should not delete a non-existent certification", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/upload/certification/${nonExistentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    test("should not delete a certification without authentication", async () => {
      const response = await request(app)
        .delete(`/api/upload/certification/${certificationId}`)
        .expect(401);

      expect(response.body.message).toContain("authentication");
    });
  });
});
