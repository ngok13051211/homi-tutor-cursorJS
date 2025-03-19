const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const { User, Notification } = require("../models");

// Mock data
const mockAdmin = {
  name: "Notification Admin",
  email: "notification-admin@example.com",
  password: "password123",
  role: "admin",
};

const mockUser = {
  name: "Notification Test User",
  email: "notification-user@example.com",
  password: "password123",
  role: "student",
};

const mockNotification = {
  type: "system_message",
  title: "Test Notification",
  message: "This is a test notification",
  relatedItem: {
    itemType: "test",
    itemId: new mongoose.Types.ObjectId(),
  },
};

let adminToken;
let userToken;
let userId;
let notificationId;

// Connect to a test database before all tests
beforeAll(async () => {
  const url =
    process.env.MONGODB_URI || "mongodb://localhost:27017/homi-tutor-test";
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Register admin
  const adminResponse = await request(app)
    .post("/api/users/register")
    .send(mockAdmin);
  adminToken = adminResponse.body.token;

  // Register user
  const userResponse = await request(app)
    .post("/api/users/register")
    .send(mockUser);
  userToken = userResponse.body.token;
  userId = userResponse.body.user._id;
});

// Clear the database and close connection after all tests
afterAll(async () => {
  await User.deleteMany({});
  await Notification.deleteMany({});
  await mongoose.connection.close();
});

describe("Notification API", () => {
  describe("POST /api/notifications", () => {
    test("should create a notification with admin token", async () => {
      const notificationData = {
        ...mockNotification,
        recipient: userId,
      };

      const response = await request(app)
        .post("/api/notifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      notificationId = response.body._id;

      expect(response.body).toHaveProperty("_id");
      expect(response.body.title).toBe(mockNotification.title);
      expect(response.body.message).toBe(mockNotification.message);
      expect(response.body.recipient.toString()).toBe(userId.toString());
      expect(response.body.read).toBe(false);
    });

    test("should not create a notification with non-admin token", async () => {
      const notificationData = {
        ...mockNotification,
        recipient: userId,
      };

      const response = await request(app)
        .post("/api/notifications")
        .set("Authorization", `Bearer ${userToken}`)
        .send(notificationData)
        .expect(403);

      expect(response.body.message).toContain("permission");
    });
  });

  describe("POST /api/notifications/announcement", () => {
    test("should create an announcement for all users with admin token", async () => {
      const announcementData = {
        title: "Test Announcement",
        message: "This is a test announcement for all users",
      };

      const response = await request(app)
        .post("/api/notifications/announcement")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(announcementData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("count");
      expect(response.body.count).toBeGreaterThan(0);
    });

    test("should create an announcement for specific role with admin token", async () => {
      const announcementData = {
        title: "Test Role Announcement",
        message: "This is a test announcement for students only",
        role: "student",
      };

      const response = await request(app)
        .post("/api/notifications/announcement")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(announcementData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("count");
      expect(response.body.count).toBeGreaterThan(0);
    });

    test("should not create an announcement with non-admin token", async () => {
      const announcementData = {
        title: "Unauthorized Announcement",
        message: "This should not work",
      };

      const response = await request(app)
        .post("/api/notifications/announcement")
        .set("Authorization", `Bearer ${userToken}`)
        .send(announcementData)
        .expect(403);

      expect(response.body.message).toContain("permission");
    });
  });

  describe("GET /api/notifications", () => {
    test("should get user notifications with pagination", async () => {
      const response = await request(app)
        .get("/api/notifications?page=1&limit=10")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("notifications");
      expect(response.body).toHaveProperty("page");
      expect(response.body).toHaveProperty("pages");
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("unreadCount");
      expect(Array.isArray(response.body.notifications)).toBeTruthy();
      expect(response.body.notifications.length).toBeGreaterThan(0);
    });

    test("should not get notifications without authentication", async () => {
      const response = await request(app).get("/api/notifications").expect(401);

      expect(response.body.message).toContain("authentication");
    });
  });

  describe("PUT /api/notifications/:id/read", () => {
    test("should mark notification as read", async () => {
      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toContain("marked as read");
    });

    test("should not mark notification as read for other user", async () => {
      // Create another user
      const anotherUser = {
        name: "Another Notification User",
        email: "another-notification@example.com",
        password: "password123",
        role: "student",
      };

      const userResponse = await request(app)
        .post("/api/users/register")
        .send(anotherUser);
      const anotherUserToken = userResponse.body.token;

      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set("Authorization", `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  describe("PUT /api/notifications/read-all", () => {
    test("should mark all notifications as read", async () => {
      // Create a few more notifications for the test
      for (let i = 0; i < 3; i++) {
        await Notification.create({
          recipient: userId,
          type: "test",
          title: `Test ${i}`,
          message: `Test message ${i}`,
          read: false,
          createdAt: Date.now(),
        });
      }

      const response = await request(app)
        .put("/api/notifications/read-all")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toContain(
        "All notifications marked as read"
      );

      // Verify all notifications are read
      const checkResponse = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      expect(checkResponse.body.unreadCount).toBe(0);
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    test("should delete notification", async () => {
      const response = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toContain("removed");
    });

    test("should return 404 for deleted notification", async () => {
      const response = await request(app)
        .get(`/api/notifications/${notificationId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    test("should not delete notification for other user", async () => {
      // Create a notification
      const notification = await Notification.create({
        recipient: userId,
        type: "test",
        title: "Test for deletion",
        message: "Should not be deleted by another user",
        read: false,
        createdAt: Date.now(),
      });

      // Create another user
      const anotherUser = {
        name: "Delete Test User",
        email: "delete-test@example.com",
        password: "password123",
        role: "student",
      };

      const userResponse = await request(app)
        .post("/api/users/register")
        .send(anotherUser);
      const anotherUserToken = userResponse.body.token;

      const response = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set("Authorization", `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.message).toContain("Not authorized");
    });
  });
});
