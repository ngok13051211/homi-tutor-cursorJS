# HomiTutor API Test Suite Overview

## Test Coverage

The test suite covers all major API endpoints and functionality of the HomiTutor application:

### User Authentication and Profile (user.test.js)

- User registration
- User login
- Profile retrieval
- Security for unauthenticated access

### Course Management (course.test.js)

- Course creation (tutor only)
- Course listing and retrieval
- Course enrollment (student only)
- Course updating (tutor only)
- Role-based permissions

### Reviews (review.test.js)

- Course review creation (student only)
- Tutor review creation (student only)
- Review retrieval
- Review updating (owner only)
- Review deletion (owner only)
- Prevention of duplicate reviews

### Search Functionality (search.test.js)

- Course search by various criteria (name, subject, price, format)
- Tutor search by various criteria (name, subject, rating)
- Pagination and sorting

### File Upload (upload.test.js)

- Profile picture upload
- Certification document upload (tutor only)
- Certification deletion
- File type validation
- Authorization checks

### Payments (payment.test.js)

- Payment creation (student only)
- Payment listing (user-specific and admin-wide)
- Payment details retrieval
- Payment status updates (admin only)
- Payment deletion (admin only)

### Notifications (notification.test.js)

- Notification creation (admin only)
- System announcements (admin only)
- Notification retrieval
- Notification marking as read
- Notification deletion

### Chat System (chat.test.js)

- Chat session creation
- Message sending
- Message retrieval
- Marking messages as read
- Chat deactivation
- Security for non-participants

## Test Security Focus

The tests emphasize security aspects:

1. **Authentication** - Testing access control for unauthenticated requests
2. **Authorization** - Testing role-based permissions (student, tutor, admin)
3. **Resource ownership** - Testing that users can only modify their own resources
4. **Input validation** - Testing responses to invalid input data

## Test Database Isolation

All tests use a separate test database to ensure:

1. Development data is not affected
2. Tests don't interfere with each other
3. Clean state before each test suite runs

## Error Case Coverage

The tests cover various error scenarios:

1. Missing authentication
2. Insufficient permissions
3. Non-existent resources
4. Invalid input data
5. Business logic constraints (e.g., double enrollment, double reviews)

## Setup and Teardown

Each test file properly sets up test data and cleans up after tests complete:

1. Database connection before tests
2. Test data creation
3. Data cleanup after tests
4. Database disconnection

This ensures tests are isolated, reproducible, and don't leave stray data.
