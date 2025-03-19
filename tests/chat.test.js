const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const {
  User,
  Course,
  ChatSession,
  Notification,
  Category,
} = require("../models");

// Mock data
const mockCategory = {
  name: "Chat Test Category",
  type: "high_school",
  grade: 10,
  description: "Test category for chat",
  subjects: [{ name: "Math", description: "Math description" }],
};

const mockTutor = {
  name: "Chat Test Tutor",
  email: "chat-tutor@example.com",
  password: "password123",
  role: "tutor",
};

const mockStudent = {
  name: "Chat Test Student",
  email: "chat-student@example.com",
  password: "password123",
  role: "student",
};

const mockCourse = {
  name: "Chat Test Course",
  description: "Test course for chat",
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
let tutorId;
let studentId;
let categoryId;
let courseId;
let chatSessionId;

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
  studentId = studentResponse.body.user._id;

  // Set course category
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
  await ChatSession.deleteMany({});
  await Notification.deleteMany({});
  await Category.deleteMany({});
  await mongoose.connection.close();
});

describe("Chat API", () => {
  describe("POST /api/chats", () => {
    test("should create a new chat session with student token", async () => {
      const chatData = {
        receiverId: tutorId,
        courseId: courseId,
        initialMessage: "Hello, I have a question about the course",
      };

      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(chatData)
        .expect(201);

      chatSessionId = response.body._id;

      expect(response.body).toHaveProperty("_id");
      expect(response.body.participants.length).toBe(2);
      expect(response.body.participants).toContain(tutorId.toString());
      expect(response.body.participants).toContain(studentId.toString());
      expect(response.body.messages.length).toBe(1);
      expect(response.body.messages[0].content).toBe(chatData.initialMessage);
      expect(response.body.messages[0].sender).toBe(studentId.toString());
    });

    test("should not create chat session with non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const chatData = {
        receiverId: nonExistentId,
        initialMessage: "This should fail",
      };

      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(chatData)
        .expect(404);

      expect(response.body.message).toBe("Receiver not found");
    });

    test("should return existing chat if one already exists between users", async () => {
      const chatData = {
        receiverId: tutorId,
        courseId: courseId,
        initialMessage: "This should use the existing chat",
      };

      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(chatData)
        .expect(200);

      expect(response.body._id).toBe(chatSessionId);

      // Should have added the new message
      const newMessageIndex = response.body.messages.length - 1;
      expect(response.body.messages[newMessageIndex].content).toBe(
        chatData.initialMessage
      );
    });
  });

  describe("GET /api/chats", () => {
    test("should get user chat sessions", async () => {
      const response = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]._id).toBe(chatSessionId);
    });

    test("should not get chat sessions without authentication", async () => {
      const response = await request(app).get("/api/chats").expect(401);

      expect(response.body.message).toContain("authentication");
    });
  });

  describe("GET /api/chats/:id", () => {
    test("should get a chat session by ID", async () => {
      const response = await request(app)
        .get(`/api/chats/${chatSessionId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("_id");
      expect(response.body._id).toBe(chatSessionId);
    });

    test("should not get chat session for non-participant", async () => {
      // Create another user who is not a participant
      const anotherUser = {
        name: "Another User",
        email: "another-chat-user@example.com",
        password: "password123",
        role: "student",
      };

      const userResponse = await request(app)
        .post("/api/users/register")
        .send(anotherUser);
      const anotherUserToken = userResponse.body.token;

      const response = await request(app)
        .get(`/api/chats/${chatSessionId}`)
        .set("Authorization", `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  describe("POST /api/chats/:id/messages", () => {
    test("should send a message in a chat session", async () => {
      const messageData = {
        content: "This is a new message in the chat",
      };

      const response = await request(app)
        .post(`/api/chats/${chatSessionId}/messages`)
        .set("Authorization", `Bearer ${tutorToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty("sender");
      expect(response.body.sender).toBe(tutorId.toString());
      expect(response.body.content).toBe(messageData.content);
    });

    test("should send a message with attachments", async () => {
      const messageData = {
        content: "Here is a message with attachment",
        attachments: [{ type: "image", url: "https://example.com/test.jpg" }],
      };

      const response = await request(app)
        .post(`/api/chats/${chatSessionId}/messages`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty("sender");
      expect(response.body.sender).toBe(studentId.toString());
      expect(response.body.content).toBe(messageData.content);
      expect(response.body.attachments).toHaveLength(1);
      expect(response.body.attachments[0].type).toBe("image");
    });

    test("should not send message in non-existent chat", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const messageData = {
        content: "This should fail",
      };

      const response = await request(app)
        .post(`/api/chats/${nonExistentId}/messages`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send(messageData)
        .expect(404);

      expect(response.body.message).toBe("Chat session not found");
    });

    test("should not send message if not a participant", async () => {
      // Create another user who is not a participant
      const anotherUser = {
        name: "Non Participant",
        email: "non-participant@example.com",
        password: "password123",
        role: "student",
      };

      const userResponse = await request(app)
        .post("/api/users/register")
        .send(anotherUser);
      const anotherUserToken = userResponse.body.token;

      const messageData = {
        content: "I should not be able to send this",
      };

      const response = await request(app)
        .post(`/api/chats/${chatSessionId}/messages`)
        .set("Authorization", `Bearer ${anotherUserToken}`)
        .send(messageData)
        .expect(403);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  describe("PUT /api/chats/:id/read", () => {
    test("should mark messages as read", async () => {
      const response = await request(app)
        .put(`/api/chats/${chatSessionId}/read`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.message).toBe("Messages marked as read");

      // Verify messages are marked as read when fetching the chat
      const chatResponse = await request(app)
        .get(`/api/chats/${chatSessionId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      // Check if tutor's messages are read
      const tutorMessages = chatResponse.body.messages.filter(
        (m) => m.sender.toString() === tutorId.toString()
      );
      expect(tutorMessages.length).toBeGreaterThan(0);
      expect(tutorMessages.every((m) => m.read)).toBeTruthy();
    });

    test("should not mark messages as read if not a participant", async () => {
      // Create another user who is not a participant
      const anotherUser = {
        name: "Another Reader",
        email: "another-reader@example.com",
        password: "password123",
        role: "student",
      };

      const userResponse = await request(app)
        .post("/api/users/register")
        .send(anotherUser);
      const anotherUserToken = userResponse.body.token;

      const response = await request(app)
        .put(`/api/chats/${chatSessionId}/read`)
        .set("Authorization", `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  describe("DELETE /api/chats/:id", () => {
    test("should not deactivate chat session if not a participant", async () => {
      // Create another user who is not a participant
      const anotherUser = {
        name: "Non Participant Deleter",
        email: "non-participant-deleter@example.com",
        password: "password123",
        role: "student",
      };

      const userResponse = await request(app)
        .post("/api/users/register")
        .send(anotherUser);
      const anotherUserToken = userResponse.body.token;

      const response = await request(app)
        .delete(`/api/chats/${chatSessionId}`)
        .set("Authorization", `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.message).toContain("Not authorized");
    });

    test("should deactivate (soft delete) chat session", async () => {
      const response = await request(app)
        .delete(`/api/chats/${chatSessionId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.message).toBe("Chat session deactivated");

      // Verify chat is deactivated by checking it's not returned in list
      const listResponse = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${studentToken}`);

      const deactivatedChat = listResponse.body.find(
        (chat) => chat._id === chatSessionId
      );
      expect(deactivatedChat).toBeUndefined();
    });
  });
});
