const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const {
  User,
  Course,
  TutorAvailability,
  Session,
  Category,
} = require("../models");
const { formatDate } = require("../utils/timeUtils");

// Mock data
const mockCategory = {
  name: "Scheduling Test Category",
  type: "high_school",
  grade: 10,
  description: "Test category for scheduling",
  subjects: [{ name: "Math", description: "Math description" }],
};

const mockTutor = {
  name: "Scheduling Test Tutor",
  email: "scheduling-tutor@example.com",
  password: "password123",
  role: "tutor",
};

const mockStudent = {
  name: "Scheduling Test Student",
  email: "scheduling-student@example.com",
  password: "password123",
  role: "student",
};

const mockAdmin = {
  name: "Scheduling Admin",
  email: "scheduling-admin@example.com",
  password: "password123",
  role: "admin",
};

const mockCourse = {
  name: "Scheduling Test Course",
  description: "Test course for scheduling",
  hourlyRate: 200000,
  subject: "Math",
  learningFormat: "Online",
  duration: 2, // 2 hours
  schedule: [
    {
      day: "Monday",
      startTime: "18:00",
      endTime: "20:00",
    },
  ],
};

// Create dates for testing
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

// Get day of week for tomorrow (0 = Sunday, 6 = Saturday)
const tomorrowDayOfWeek = tomorrow.getDay();

// Format date for API
const tomorrowFormatted = formatDate(tomorrow);

// Mock availability data
const mockAvailability = {
  dayOfWeek: tomorrowDayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
  isRecurring: true,
};

// Mock session booking data
const mockSessionBooking = {
  startDate: tomorrowFormatted,
  startTime: "10:00",
  endTime: "12:00",
};

let tutorToken;
let studentToken;
let adminToken;
let tutorId;
let studentId;
let categoryId;
let courseId;
let availabilityId;
let sessionId;

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

  // Register users
  const tutorResponse = await request(app)
    .post("/api/users/register")
    .send(mockTutor);

  tutorToken = tutorResponse.body.token;
  tutorId = tutorResponse.body.user._id;

  const studentResponse = await request(app)
    .post("/api/users/register")
    .send(mockStudent);

  studentToken = studentResponse.body.token;
  studentId = studentResponse.body.user._id;

  const adminResponse = await request(app)
    .post("/api/users/register")
    .send(mockAdmin);

  adminToken = adminResponse.body.token;

  // Set course category and tutor
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
  await TutorAvailability.deleteMany({});
  await Session.deleteMany({});
  await Category.deleteMany({});
  await mongoose.connection.close();
});

describe("Scheduling API", () => {
  describe("Tutor Availability Management", () => {
    test("should add availability with tutor token", async () => {
      const response = await request(app)
        .post("/api/availability")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send(mockAvailability)
        .expect(201);

      availabilityId = response.body._id;

      expect(response.body).toHaveProperty("_id");
      expect(response.body.tutor).toBe(tutorId);
      expect(response.body.dayOfWeek).toBe(mockAvailability.dayOfWeek);
      expect(response.body.startTime).toBe(mockAvailability.startTime);
      expect(response.body.endTime).toBe(mockAvailability.endTime);
    });

    test("should not add availability with student token", async () => {
      const response = await request(app)
        .post("/api/availability")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(mockAvailability)
        .expect(403);

      expect(response.body.message).toContain("Only tutors");
    });

    test("should get tutor availability", async () => {
      const response = await request(app)
        .get(`/api/availability/tutor/${tutorId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].tutor).toBe(tutorId);
    });

    test("should get available time slots for a specific date", async () => {
      const response = await request(app)
        .get(`/api/availability/slots/${tutorId}/${tomorrowFormatted}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);

      // Should have the requested timeslot available
      const slot = response.body.find((slot) => slot.time === "10:00");
      expect(slot).toBeDefined();
      expect(slot.available).toBe(true);
    });

    test("should update availability with tutor token", async () => {
      const updateData = {
        startTime: "10:00",
        endTime: "18:00",
      };

      const response = await request(app)
        .put(`/api/availability/${availabilityId}`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.startTime).toBe(updateData.startTime);
      expect(response.body.endTime).toBe(updateData.endTime);
    });
  });

  describe("Session Booking", () => {
    test("should book a session with student token", async () => {
      const bookingData = {
        ...mockSessionBooking,
        courseId,
      };

      const response = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(bookingData)
        .expect(201);

      sessionId = response.body._id;

      expect(response.body).toHaveProperty("_id");
      expect(response.body.student).toBe(studentId);
      expect(response.body.tutor).toBe(tutorId);
      expect(response.body.course).toBe(courseId);
      expect(response.body.status).toBe("pending");
    });

    test("should not book a session with tutor token", async () => {
      const bookingData = {
        ...mockSessionBooking,
        courseId,
      };

      const response = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${tutorToken}`)
        .send(bookingData)
        .expect(403);

      expect(response.body.message).toContain("Only students");
    });

    test("should not book a session outside of tutor availability", async () => {
      const bookingData = {
        courseId,
        startDate: tomorrowFormatted,
        startTime: "06:00", // Before tutor's available hours
        endTime: "08:00",
      };

      const response = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.message).toContain(
        "not within the tutor's available hours"
      );
    });

    test("should not book overlapping sessions", async () => {
      const bookingData = {
        ...mockSessionBooking, // Same time as the first booking
        courseId,
      };

      const response = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.message).toContain("conflicts with another booking");
    });

    test("should get sessions for student", async () => {
      const response = await request(app)
        .get("/api/sessions")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].student._id).toBe(studentId);
    });

    test("should get sessions for tutor", async () => {
      const response = await request(app)
        .get("/api/sessions")
        .set("Authorization", `Bearer ${tutorToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].tutor._id).toBe(tutorId);
    });

    test("should get a specific session by ID", async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("_id");
      expect(response.body._id).toBe(sessionId);
    });

    test("should update session status to confirmed by tutor", async () => {
      const updateData = {
        status: "confirmed",
        meetingLink: "https://meet.example.com/session123",
      };

      const response = await request(app)
        .put(`/api/sessions/${sessionId}/status`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe(updateData.status);
      expect(response.body.meetingLink).toBe(updateData.meetingLink);
    });

    test("should not allow student to mark session as completed", async () => {
      const updateData = {
        status: "completed",
      };

      const response = await request(app)
        .put(`/api/sessions/${sessionId}/status`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain(
        "Only tutors can mark sessions as completed"
      );
    });

    test("should trigger session reminders with admin token", async () => {
      const response = await request(app)
        .post("/api/sessions/send-reminders")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success");
      expect(response.body.success).toBe(true);
    });

    test("should not trigger session reminders with non-admin token", async () => {
      const response = await request(app)
        .post("/api/sessions/send-reminders")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.message).toContain("Only admins");
    });

    test("should allow student to add notes to session", async () => {
      const updateData = {
        notes: "Looking forward to this session!",
      };

      const response = await request(app)
        .put(`/api/sessions/${sessionId}/notes`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.notes).toBe(updateData.notes);
    });

    test("should allow student to cancel session", async () => {
      const updateData = {
        status: "cancelled",
      };

      const response = await request(app)
        .put(`/api/sessions/${sessionId}/status`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe(updateData.status);
    });
  });

  describe("Availability Deletion", () => {
    test("should delete availability with tutor token", async () => {
      const response = await request(app)
        .delete(`/api/availability/${availabilityId}`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .expect(200);

      expect(response.body.message).toContain("removed");
    });

    test("should return 404 for deleted availability", async () => {
      const response = await request(app)
        .get(`/api/availability/${availabilityId}`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });
  });
});
