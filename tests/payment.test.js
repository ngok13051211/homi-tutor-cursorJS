const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const { User, Course, Payment, Category } = require("../models");

// Mock data
const mockCategory = {
  name: "Payment Test Category",
  type: "high_school",
  grade: 10,
  description: "Test category for payments",
  subjects: [{ name: "Math", description: "Math description" }],
};

const mockAdmin = {
  name: "Admin User",
  email: "admin@example.com",
  password: "password123",
  role: "admin",
};

const mockTutor = {
  name: "Payment Test Tutor",
  email: "payment-tutor@example.com",
  password: "password123",
  role: "tutor",
};

const mockStudent = {
  name: "Payment Test Student",
  email: "payment-student@example.com",
  password: "password123",
  role: "student",
};

const mockCourse = {
  name: "Payment Test Course",
  description: "Test course for payments",
  hourlyRate: 200000,
  subject: "Math",
  learningFormat: "Online",
  duration: 5,
  schedule: [
    {
      day: "Monday",
      startTime: "18:00",
      endTime: "20:00",
    },
  ],
};

const mockPayment = {
  paymentMethod: "credit_card",
  description: "Payment for test course",
};

let adminToken;
let tutorToken;
let studentToken;
let categoryId;
let courseId;
let paymentId;

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

  // Register admin
  const adminResponse = await request(app)
    .post("/api/users/register")
    .send(mockAdmin);
  adminToken = adminResponse.body.token;

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

  // Create a course
  const courseResponse = await request(app)
    .post("/api/courses")
    .set("Authorization", `Bearer ${tutorToken}`)
    .send(mockCourse);
  courseId = courseResponse.body._id;
});

// Clear the database and close connection after all tests
afterAll(async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
  await Payment.deleteMany({});
  await Category.deleteMany({});
  await mongoose.connection.close();
});

describe("Payment API", () => {
  describe("POST /api/payments", () => {
    test("should create a new payment with student token", async () => {
      const response = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ ...mockPayment, courseId })
        .expect(201);

      paymentId = response.body._id;

      expect(response.body).toHaveProperty("_id");
      expect(response.body.paymentMethod).toBe(mockPayment.paymentMethod);
      expect(response.body.status).toBe("pending");
      expect(response.body.amount).toBe(
        mockCourse.hourlyRate * mockCourse.duration
      );
    });

    test("should not create a payment with tutor token", async () => {
      const response = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send({ ...mockPayment, courseId })
        .expect(403);

      expect(response.body.message).toContain("permission");
    });

    test("should not create a payment for non-existent course", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ ...mockPayment, courseId: nonExistentId })
        .expect(404);

      expect(response.body.message).toBe("Course not found");
    });
  });

  describe("GET /api/payments/user", () => {
    test("should get student payments with student token", async () => {
      const response = await request(app)
        .get("/api/payments/user")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].paymentMethod).toBe(mockPayment.paymentMethod);
    });

    test("should get tutor payments with tutor token", async () => {
      const response = await request(app)
        .get("/api/payments/user")
        .set("Authorization", `Bearer ${tutorToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      // The payment is for this tutor's course, so it should show up
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/payments/:id", () => {
    test("should get a payment by ID with student token", async () => {
      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("_id");
      expect(response.body._id).toBe(paymentId);
    });

    test("should get a payment by ID with tutor token", async () => {
      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("_id");
      expect(response.body._id).toBe(paymentId);
    });

    test("should not get a payment for unrelated user", async () => {
      // Create another student who shouldn't have access
      const anotherStudent = {
        name: "Another Student",
        email: "another-student@example.com",
        password: "password123",
        role: "student",
      };

      const studentResponse = await request(app)
        .post("/api/users/register")
        .send(anotherStudent);
      const anotherStudentToken = studentResponse.body.token;

      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set("Authorization", `Bearer ${anotherStudentToken}`)
        .expect(403);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  describe("GET /api/payments", () => {
    test("should get all payments with admin token", async () => {
      const response = await request(app)
        .get("/api/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("should not get all payments with non-admin token", async () => {
      const response = await request(app)
        .get("/api/payments")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.message).toContain("permission");
    });
  });

  describe("PUT /api/payments/:id", () => {
    test("should update payment status with admin token", async () => {
      const updateData = {
        status: "completed",
        transactionId: "txn_test123456",
      };

      const response = await request(app)
        .put(`/api/payments/${paymentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe(updateData.status);
      expect(response.body.transactionId).toBe(updateData.transactionId);
      expect(response.body).toHaveProperty("paymentDate");
    });

    test("should not update payment status with non-admin token", async () => {
      const response = await request(app)
        .put(`/api/payments/${paymentId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ status: "refunded" })
        .expect(403);

      expect(response.body.message).toContain("permission");
    });
  });

  describe("DELETE /api/payments/:id", () => {
    test("should not delete payment with non-admin token", async () => {
      const response = await request(app)
        .delete(`/api/payments/${paymentId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.message).toContain("permission");
    });

    test("should delete payment with admin token", async () => {
      const response = await request(app)
        .delete(`/api/payments/${paymentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain("removed");
    });

    test("should return 404 for deleted payment", async () => {
      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBe("Payment not found");
    });
  });
});
