# HomiTutor API Tests

This directory contains automated tests for the HomiTutor API using Jest and Supertest.

## Test Files

- `user.test.js` - Tests for user authentication and profile management
- `course.test.js` - Tests for course creation, retrieval, and enrollment
- `review.test.js` - Tests for course and tutor reviews
- `search.test.js` - Tests for searching courses and tutors
- `upload.test.js` - Tests for file upload functionality
- `payment.test.js` - Tests for payment processing
- `notification.test.js` - Tests for notification system
- `chat.test.js` - Tests for chat functionality

## Running Tests

To run all tests:

```bash
npm test
```

On Windows, you may encounter issues with Jest execution. In such cases, use:

```bash
npm run test:windows
```

## Test Database

The tests use a separate test database (`homi-tutor-test`) to avoid affecting development data. The database is cleaned up after each test suite runs.

## Test Structure

Each test file follows a similar structure:

1. **Setup** - Connect to the test database and create necessary test data
2. **Test Suites** - Group related tests by API endpoint
3. **Cleanup** - Remove test data and disconnect from the database

## Authentication

Most API endpoints require authentication. The tests create test users with different roles (student, tutor, admin) and generate valid JWT tokens for testing protected routes.

## File Upload Tests

The `upload.test.js` file tests file upload functionality. It creates temporary test files for testing and cleans them up after the tests run.

## Common Test Patterns

- Testing successful operations with valid data
- Testing API security (unauthorized access, role-based permissions)
- Testing error handling (invalid data, non-existent resources)
- Testing business logic (e.g., students can't create courses, tutors can't enroll in courses)
