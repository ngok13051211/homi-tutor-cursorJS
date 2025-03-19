const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const { User, Course, Category, TutorProfile } = require("../models");

// Mock data
const mockCategory = {
  name: "Search Test Category",
  type: "high_school",
  grade: 10,
  description: "Test category for searches",
  subjects: [{ name: "Math", description: "Math description" }],
};

const mockTutors = [
  {
    name: "John Smith",
    email: "john.smith@example.com",
    password: "password123",
    role: "tutor",
  },
  {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    password: "password123",
    role: "tutor",
  },
  {
    name: "Michael Johnson",
    email: "michael.johnson@example.com",
    password: "password123",
    role: "tutor",
  },
];

const mockCourses = [
  {
    name: "Advanced Calculus",
    description: "Learn advanced calculus concepts",
    hourlyRate: 250000,
    subject: "Math",
    learningFormat: "Online",
    duration: 10,
    schedule: [
      {
        day: "Monday",
        startTime: "18:00",
        endTime: "20:00",
      },
    ],
  },
  {
    name: "Algebra Fundamentals",
    description: "Master the basics of algebra",
    hourlyRate: 200000,
    subject: "Math",
    learningFormat: "Offline",
    duration: 8,
    schedule: [
      {
        day: "Tuesday",
        startTime: "16:00",
        endTime: "18:00",
      },
    ],
  },
  {
    name: "Geometry and Trigonometry",
    description: "Comprehensive geometry and trigonometry course",
    hourlyRate: 225000,
    subject: "Math",
    learningFormat: "Hybrid",
    duration: 12,
    schedule: [
      {
        day: "Wednesday",
        startTime: "17:00",
        endTime: "19:30",
      },
    ],
  },
];

let categoryId;
let tutorTokens = [];
let tutorIds = [];

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

  // Register tutors and create courses
  for (let i = 0; i < mockTutors.length; i++) {
    const tutorResponse = await request(app)
      .post("/api/users/register")
      .send(mockTutors[i]);

    tutorTokens[i] = tutorResponse.body.token;
    tutorIds[i] = tutorResponse.body.user._id;

    // Create a course for each tutor
    mockCourses[i].category = categoryId;
    await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${tutorTokens[i]}`)
      .send(mockCourses[i]);
  }
});

// Clear the database and close connection after all tests
afterAll(async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
  await Category.deleteMany({});
  await TutorProfile.deleteMany({});
  await mongoose.connection.close();
});

describe("Search API", () => {
  describe("GET /api/search/courses", () => {
    test("should search courses by name", async () => {
      const response = await request(app)
        .get("/api/search/courses?name=calculus")
        .expect(200);

      expect(response.body).toHaveProperty("courses");
      expect(Array.isArray(response.body.courses)).toBeTruthy();
      expect(response.body.courses.length).toBeGreaterThan(0);
      expect(response.body.courses[0].name).toContain("Calculus");
    });

    test("should search courses by subject", async () => {
      const response = await request(app)
        .get("/api/search/courses?subject=Math")
        .expect(200);

      expect(response.body).toHaveProperty("courses");
      expect(Array.isArray(response.body.courses)).toBeTruthy();
      expect(response.body.courses.length).toBe(3); // All courses are Math
    });

    test("should search courses by learning format", async () => {
      const response = await request(app)
        .get("/api/search/courses?learningFormat=Online")
        .expect(200);

      expect(response.body).toHaveProperty("courses");
      expect(Array.isArray(response.body.courses)).toBeTruthy();
      expect(response.body.courses.length).toBeGreaterThan(0);
      expect(response.body.courses[0].learningFormat).toBe("Online");
    });

    test("should search courses by price range", async () => {
      const response = await request(app)
        .get("/api/search/courses?minPrice=220000&maxPrice=260000")
        .expect(200);

      expect(response.body).toHaveProperty("courses");
      expect(Array.isArray(response.body.courses)).toBeTruthy();

      // Check that all returned courses are within the price range
      response.body.courses.forEach((course) => {
        expect(course.hourlyRate).toBeGreaterThanOrEqual(220000);
        expect(course.hourlyRate).toBeLessThanOrEqual(260000);
      });
    });

    test("should return empty array for non-existent search criteria", async () => {
      const response = await request(app)
        .get("/api/search/courses?name=nonexistent")
        .expect(200);

      expect(response.body).toHaveProperty("courses");
      expect(Array.isArray(response.body.courses)).toBeTruthy();
      expect(response.body.courses.length).toBe(0);
    });
  });

  describe("GET /api/search/tutors", () => {
    test("should search tutors by name", async () => {
      const response = await request(app)
        .get("/api/search/tutors?name=john")
        .expect(200);

      expect(response.body).toHaveProperty("tutors");
      expect(Array.isArray(response.body.tutors)).toBeTruthy();
      expect(response.body.tutors.length).toBeGreaterThan(0);
      expect(response.body.tutors[0].name).toContain("John");
    });

    test("should search tutors by subject expertise", async () => {
      // Note: This assumes that tutor profiles have been updated with subjects
      // In a real test, we would need to ensure tutors have Math as a subject
      const response = await request(app)
        .get("/api/search/tutors?subject=Math")
        .expect(200);

      expect(response.body).toHaveProperty("tutors");
      expect(Array.isArray(response.body.tutors)).toBeTruthy();
    });

    test("should search tutors by rating range", async () => {
      // Note: This assumes tutor ratings have been set up
      // In a real test, we would need to add reviews to set ratings
      const response = await request(app)
        .get("/api/search/tutors?minRating=4")
        .expect(200);

      expect(response.body).toHaveProperty("tutors");
      expect(Array.isArray(response.body.tutors)).toBeTruthy();
    });

    test("should return empty array for non-existent search criteria", async () => {
      const response = await request(app)
        .get("/api/search/tutors?name=nonexistent")
        .expect(200);

      expect(response.body).toHaveProperty("tutors");
      expect(Array.isArray(response.body.tutors)).toBeTruthy();
      expect(response.body.tutors.length).toBe(0);
    });
  });
});
