const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const { User, Course, Review, Category, TutorProfile } = require("../models");

// Mock data
const mockCategory = {
  name: "Review Test Category",
  type: "high_school",
  grade: 10,
  description: "Test category for reviews",
  subjects: [{ name: "Math", description: "Math description" }],
};

const mockTutor = {
  name: "Review Test Tutor",
  email: "review-tutor@example.com",
  password: "password123",
  role: "tutor",
};

const mockStudent = {
  name: "Review Test Student",
  email: "review-student@example.com",
  password: "password123",
  role: "student",
};

const mockCourse = {
  name: "Review Test Course",
  description: "Test course for reviews",
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

const mockReview = {
  rating: 4,
  comment: "Great course and tutor!",
};

let tutorToken;
let studentToken;
let tutorId;
let categoryId;
let courseId;
let reviewId;

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
  tutorId = tutorResponse.body.user._id;

  // Register student
  const studentResponse = await request(app)
    .post("/api/users/register")
    .send(mockStudent);
  studentToken = studentResponse.body.token;

  // Set course category and tutor
  mockCourse.category = categoryId;

  // Create a course
  const courseResponse = await request(app)
    .post("/api/courses")
    .set("Authorization", `Bearer ${tutorToken}`)
    .send(mockCourse);
  courseId = courseResponse.body._id;

  // Enroll student in course
  await request(app)
    .post(`/api/courses/${courseId}/enroll`)
    .set("Authorization", `Bearer ${studentToken}`);
});

// Clear the database and close connection after all tests
afterAll(async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
  await Review.deleteMany({});
  await Category.deleteMany({});
  await TutorProfile.deleteMany({});
  await mongoose.connection.close();
});

describe("Review API", () => {
  describe("POST /api/reviews/course/:courseId", () => {
    test("should create a new course review with valid student token", async () => {
      const response = await request(app)
        .post(`/api/reviews/course/${courseId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(mockReview)
        .expect(201);

      reviewId = response.body._id;

      expect(response.body).toHaveProperty("_id");
      expect(response.body.rating).toBe(mockReview.rating);
      expect(response.body.comment).toBe(mockReview.comment);
      expect(response.body.course.toString()).toBe(courseId);
    });

    test("should not create a review with tutor token", async () => {
      const response = await request(app)
        .post(`/api/reviews/course/${courseId}`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .send(mockReview)
        .expect(403);

      expect(response.body.message).toContain("permission");
    });

    test("should not allow multiple reviews for the same course by the same student", async () => {
      const response = await request(app)
        .post(`/api/reviews/course/${courseId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(mockReview)
        .expect(400);

      expect(response.body.message).toContain("already reviewed");
    });
  });

  describe("POST /api/reviews/tutor/:tutorId", () => {
    test("should create a new tutor review with valid student token", async () => {
      const response = await request(app)
        .post(`/api/reviews/tutor/${tutorId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(mockReview)
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.rating).toBe(mockReview.rating);
      expect(response.body.comment).toBe(mockReview.comment);
      expect(response.body.tutor.toString()).toBe(tutorId);
    });
  });

  describe("GET /api/reviews/course/:courseId", () => {
    test("should get all reviews for a course", async () => {
      const response = await request(app)
        .get(`/api/reviews/course/${courseId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].course.toString()).toBe(courseId);
    });
  });

  describe("GET /api/reviews/tutor/:tutorId", () => {
    test("should get all reviews for a tutor", async () => {
      const response = await request(app)
        .get(`/api/reviews/tutor/${tutorId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].tutor.toString()).toBe(tutorId);
    });
  });

  describe("PUT /api/reviews/:id", () => {
    test("should update a review with valid student token", async () => {
      const updateData = {
        rating: 5,
        comment: "Updated review - excellent course!",
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.rating).toBe(updateData.rating);
      expect(response.body.comment).toBe(updateData.comment);
    });

    test("should not update a review with another user token", async () => {
      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .send({ rating: 1, comment: "Hacked review" })
        .expect(403);

      expect(response.body.message).toContain("permission");
    });
  });

  describe("DELETE /api/reviews/:id", () => {
    test("should delete a review with valid student token", async () => {
      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.message).toContain("successfully deleted");
    });

    test("should return 404 for deleted review", async () => {
      const response = await request(app)
        .get(`/api/reviews/${reviewId}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });
  });
});
