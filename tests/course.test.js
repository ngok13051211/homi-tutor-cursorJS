const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index"); // Import the Express app
const { User, Course, Category, TutorProfile } = require("../models");

// Mock data
const mockCategory = {
  name: "Test Category",
  type: "high_school",
  grade: 10,
  description: "Test category for high school",
  subjects: [{ name: "Math", description: "Math description" }],
};

const mockTutor = {
  name: "Test Tutor",
  email: "tutor@example.com",
  password: "password123",
  role: "tutor",
};

const mockStudent = {
  name: "Test Student",
  email: "student@example.com",
  password: "password123",
  role: "student",
};

const mockCourse = {
  name: "Test Course",
  description: "Test course description",
  hourlyRate: 200000,
  subject: "Math",
  learningFormat: "Online",
  duration: 8,
  schedule: [
    {
      day: "Monday",
      startTime: "18:00",
      endTime: "20:00",
    },
  ],
};

let tutorToken;
let studentToken;
let categoryId;
let courseId;

// Connect to a test database before all tests
beforeAll(async () => {
  const url =
    process.env.MONGODB_URI || "mongodb://localhost:27017/homi-tutor-test";
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create test category
  const category = await Category.create(mockCategory);
  categoryId = category._id;

  // Register tutor
  const tutorResponse = await request(app)
    .post("/api/users/register")
    .send(mockTutor);
  tutorToken = tutorResponse.body.token;

  // Register student
  const studentResponse = await request(app)
    .post("/api/users/register")
    .send(mockStudent);
  studentToken = studentResponse.body.token;

  // Set course category
  mockCourse.category = categoryId;
});

// Clear the database and close connection after all tests
afterAll(async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
  await Category.deleteMany({});
  await TutorProfile.deleteMany({});
  await mongoose.connection.close();
});

describe("Course API", () => {
  describe("POST /api/courses", () => {
    test("should create a new course with valid tutor token", async () => {
      const response = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send(mockCourse)
        .expect(201);

      courseId = response.body._id;

      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(mockCourse.name);
      expect(response.body.hourlyRate).toBe(mockCourse.hourlyRate);
    });

    test("should not create a course with student token", async () => {
      const response = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(mockCourse)
        .expect(403);

      expect(response.body.message).toContain("permission");
    });
  });

  describe("GET /api/courses", () => {
    test("should get all courses", async () => {
      const response = await request(app).get("/api/courses").expect(200);

      expect(response.body).toHaveProperty("courses");
      expect(Array.isArray(response.body.courses)).toBeTruthy();
      expect(response.body.courses.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/courses/:id", () => {
    test("should get a course by ID", async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}`)
        .expect(200);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(mockCourse.name);
    });

    test("should return 404 for non-existent course", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/courses/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe("Course not found");
    });
  });

  describe("POST /api/courses/:id/enroll", () => {
    test("should enroll a student in a course", async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.message).toContain("Successfully enrolled");
    });

    test("should not allow tutors to enroll in courses", async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .expect(403);

      expect(response.body.message).toContain("permission");
    });
  });

  describe("PUT /api/courses/:id", () => {
    test("should update a course with tutor token", async () => {
      const updateData = {
        name: "Updated Course Name",
        hourlyRate: 250000,
      };

      const response = await request(app)
        .put(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.hourlyRate).toBe(updateData.hourlyRate);
    });

    test("should not update a course with student token", async () => {
      const response = await request(app)
        .put(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ name: "Student Update Attempt" })
        .expect(403);

      expect(response.body.message).toContain("permission");
    });
  });

  // Note: We're not testing DELETE since it would remove the course for subsequent tests
});
