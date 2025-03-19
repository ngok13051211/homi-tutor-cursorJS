const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index"); // Import the Express app
const { User } = require("../models");

// Mock data
const mockUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  role: "student",
};

// Connect to a test database before all tests
beforeAll(async () => {
  const url =
    process.env.MONGODB_URI || "mongodb://localhost:27017/homi-tutor-test";
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clear the database and close connection after all tests
afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

// Clean up database after each test
afterEach(async () => {
  await User.deleteMany({});
});

describe("User Authentication API", () => {
  describe("POST /api/users/register", () => {
    test("should register a new user", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send(mockUser)
        .expect(201);

      // Check response
      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(mockUser.name);
      expect(response.body.email).toBe(mockUser.email);
      expect(response.body).toHaveProperty("token");
      expect(response.body).not.toHaveProperty("password");
    });

    test("should not register a user with existing email", async () => {
      // First registration
      await request(app).post("/api/users/register").send(mockUser);

      // Try to register with same email
      const response = await request(app)
        .post("/api/users/register")
        .send(mockUser)
        .expect(400);

      expect(response.body.message).toBe("User already exists");
    });
  });

  describe("POST /api/users/login", () => {
    test("should login user with correct credentials", async () => {
      // First register a user
      await request(app).post("/api/users/register").send(mockUser);

      // Login with correct credentials
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: mockUser.email,
          password: mockUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.email).toBe(mockUser.email);
      expect(response.body).toHaveProperty("token");
    });

    test("should not login with incorrect credentials", async () => {
      // Register a user
      await request(app).post("/api/users/register").send(mockUser);

      // Try login with wrong password
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: mockUser.email,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.message).toBe("Invalid email or password");
    });
  });

  describe("GET /api/users/profile", () => {
    test("should get user profile with valid token", async () => {
      // Register and login
      const registerResponse = await request(app)
        .post("/api/users/register")
        .send(mockUser);

      const token = registerResponse.body.token;

      // Get profile with token
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(mockUser.name);
      expect(response.body.email).toBe(mockUser.email);
    });

    test("should not access profile without token", async () => {
      const response = await request(app).get("/api/users/profile").expect(401);

      expect(response.body.message).toBe(
        "No authentication token, access denied"
      );
    });
  });
});
