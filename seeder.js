const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Import models
const User = require("./models/User");
const Category = require("./models/Category");
const Course = require("./models/Course");
const TutorProfile = require("./models/TutorProfile");
const StudentProfile = require("./models/StudentProfile");
const Review = require("./models/Review");
const ChatSession = require("./models/ChatSession");
const Payment = require("./models/Payment");
const Notification = require("./models/Notification");
const Role = require("./models/Role");

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Sample user data
const users = [
  {
    name: "Emily Davis",
    email: "emily@example.com",
    password: "password123",
    role: "tutor",
    profilePicture: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    name: "Michael Brown",
    email: "michael@example.com",
    password: "password123",
    role: "student",
    profilePicture: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    password: "password123",
    role: "tutor",
    profilePicture: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    name: "David Wilson",
    email: "david@example.com",
    password: "password123",
    role: "tutor",
    profilePicture: "https://randomuser.me/api/portraits/men/7.jpg",
  },
  {
    name: "Jennifer Lee",
    email: "jennifer@example.com",
    password: "password123",
    role: "tutor",
    profilePicture: "https://randomuser.me/api/portraits/women/8.jpg",
  },
  {
    name: "Alex Taylor",
    email: "alex@example.com",
    password: "password123",
    role: "student",
    profilePicture: "https://randomuser.me/api/portraits/men/11.jpg",
  },
  {
    name: "Emma Martinez",
    email: "emma@example.com",
    password: "password123",
    role: "student",
    profilePicture: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    name: "James Anderson",
    email: "james@example.com",
    password: "password123",
    role: "student",
    profilePicture: "https://randomuser.me/api/portraits/men/14.jpg",
  },
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    profilePicture: "https://randomuser.me/api/portraits/men/5.jpg",
  },
];

// Sample categories
const categories = [
  {
    name: "Primary School",
    type: "elementary_school",
    grade: 5,
    description: "Subjects for primary school students (Classes 1-5)",
    subjects: [
      {
        name: "Mathematics",
        description: "Arithmetic, basic geometry, and problem-solving",
      },
      {
        name: "English",
        description: "Reading comprehension, grammar, and writing",
      },
      { name: "Science", description: "Basic concepts in natural sciences" },
      {
        name: "Social Studies",
        description: "Introduction to history, geography, and civics",
      },
      {
        name: "Arts",
        description: "Visual arts, music, and creative expression",
      },
      {
        name: "Reading",
        description: "Early reading skills and phonics",
      },
      {
        name: "Writing",
        description: "Introduction to writing skills and sentence structure",
      },
    ],
  },
  {
    name: "Middle School",
    type: "middle_school",
    grade: 8,
    description: "Subjects for middle school students (Classes 6-9)",
    subjects: [
      {
        name: "Algebra",
        description: "Foundation of algebraic concepts and equations",
      },
      {
        name: "Geometry",
        description: "Study of shapes, sizes, and properties of space",
      },
      {
        name: "Literature",
        description: "Analysis of literary works and writing techniques",
      },
      {
        name: "Biology",
        description: "Study of living organisms and their processes",
      },
      {
        name: "Chemistry",
        description: "Introduction to chemical elements and reactions",
      },
      { name: "Physics", description: "Basic principles of matter and energy" },
      {
        name: "History",
        description: "World and national historical events and contexts",
      },
      {
        name: "Geography",
        description: "Study of Earth's landscapes, environments, and societies",
      },
    ],
  },
  {
    name: "High School",
    type: "high_school",
    grade: 11,
    description: "Subjects for high school students (Classes 10-12)",
    subjects: [
      {
        name: "Advanced Mathematics",
        description: "Complex mathematical concepts and applications",
      },
      {
        name: "Calculus",
        description: "Study of rates of change and accumulation",
      },
      {
        name: "English Literature",
        description: "Critical analysis of literary works and composition",
      },
      {
        name: "Physics",
        description:
          "Advanced concepts in mechanics, electricity, and modern physics",
      },
      {
        name: "Chemistry",
        description: "Detailed study of chemical processes and reactions",
      },
      {
        name: "Biology",
        description: "Comprehensive study of living organisms and systems",
      },
      {
        name: "History",
        description: "In-depth analysis of historical events and their impacts",
      },
      {
        name: "Economics",
        description: "Principles of microeconomics and macroeconomics",
      },
      {
        name: "Computer Science",
        description: "Programming, algorithms, and computational thinking",
      },
      {
        name: "SAT",
        description: "Comprehensive preparation for the SAT exam",
      },
      {
        name: "ACT",
        description: "Strategies and practice for the ACT exam",
      },
      {
        name: "IELTS",
        description:
          "Preparation for the International English Language Testing System",
      },
      {
        name: "TOEFL",
        description: "Test of English as a Foreign Language preparation",
      },
      {
        name: "GRE",
        description: "Graduate Record Examination preparation",
      },
      {
        name: "GMAT",
        description: "Graduate Management Admission Test preparation",
      },
    ],
  },
  {
    name: "Foreign Languages",
    type: "foreign_languages",
    description: "Language learning courses",
    subjects: [
      {
        name: "Spanish",
        description: "Learn Spanish vocabulary, grammar, and conversation",
      },
      {
        name: "French",
        description: "Learn French vocabulary, grammar, and conversation",
      },
      {
        name: "German",
        description: "Learn German vocabulary, grammar, and conversation",
      },
      {
        name: "Chinese",
        description: "Learn Mandarin Chinese characters and conversation",
      },
      {
        name: "Japanese",
        description: "Learn Japanese language and writing systems",
      },
      {
        name: "Korean",
        description: "Learn Korean language, grammar, and script",
      },
    ],
  },
];

// Sample tutor profiles
const tutorProfiles = [
  {
    biography:
      "Experienced mathematics teacher with over 10 years of teaching high school students. Specializes in calculus and algebra.",
    experience: 10,
    hourlyRate: 50,
    subjects: ["Advanced Mathematics", "Calculus", "Algebra"],
    certifications: [
      {
        name: "Mathematics Teaching Certification",
        issuer: "National Board of Education",
        year: 2012,
      },
      {
        name: "Advanced Calculus Certification",
        issuer: "Mathematics Association",
        year: 2015,
      },
    ],
  },
  {
    biography:
      "English literature specialist with a passion for creative writing. Helps students develop their writing skills and analyze literary works.",
    experience: 8,
    hourlyRate: 45,
    subjects: ["English Literature", "Creative Writing", "Grammar"],
    certifications: [
      {
        name: "Creative Writing Certification",
        issuer: "Writers Association",
        year: 2017,
      },
    ],
  },
  {
    biography:
      "Physics educator with a background in engineering. Makes complex physical concepts accessible through practical demonstrations and real-world examples.",
    experience: 12,
    hourlyRate: 55,
    subjects: ["Physics", "Advanced Mathematics", "Computer Science"],
    certifications: [
      {
        name: "Advanced Physics Teaching Certification",
        issuer: "Science Education Board",
        year: 2013,
      },
      {
        name: "Computer Science Instruction Certification",
        issuer: "Technology Education Institute",
        year: 2018,
      },
    ],
  },
  {
    biography:
      "Elementary education specialist focusing on foundational skills. Creates engaging learning experiences for young students.",
    experience: 15,
    hourlyRate: 40,
    subjects: ["Mathematics", "Reading", "Science", "Social Studies"],
    certifications: [
      {
        name: "Elementary Education Certification",
        issuer: "Education Board",
        year: 2010,
      },
      {
        name: "Early Childhood Development Certification",
        issuer: "Child Development Institute",
        year: 2014,
      },
    ],
  },
];

// Sample student profiles
const studentProfiles = [
  {
    gradeLevel: "10th Grade",
    interests: ["Mathematics", "Science"],
    learningGoals: "Improve calculus skills and prepare for competitive exams",
    preferredLearningStyle: "Visual",
  },
  {
    gradeLevel: "8th Grade",
    interests: ["Literature", "Arts"],
    learningGoals: "Enhance creative writing and reading comprehension skills",
    preferredLearningStyle: "Auditory",
  },
  {
    gradeLevel: "12th Grade",
    interests: ["Computer Science", "Mathematics"],
    learningGoals:
      "Prepare for university entrance exams and programming competitions",
    preferredLearningStyle: "Kinesthetic",
  },
  {
    gradeLevel: "9th Grade",
    interests: ["Foreign Languages", "History"],
    learningGoals: "Improve language proficiency and historical knowledge",
    preferredLearningStyle: "Reading/Writing",
  },
];

// Sample courses
const generateCourses = (tutors, categories) => {
  // Helper function to find a subject object by name within the categories
  const findSubject = (subjectName) => {
    for (const category of categories) {
      const subject = category.subjects.find((s) => s.name === subjectName);
      if (subject) {
        return subject.name;
      }
    }
    return subjectName; // Fallback if not found
  };

  return [
    {
      name: "Advanced Calculus for High School Students",
      tutor: tutors[0]._id,
      category: categories[2]._id, // High School (index adjusted after removing Kindergarten)
      subject: findSubject("Calculus"),
      description:
        "A comprehensive course covering calculus concepts for high school students preparing for college. Topics include limits, derivatives, integrals, and their applications.",
      hourlyRate: 50,
      schedule: [
        { day: "Monday", startTime: "16:00", endTime: "17:30" },
        { day: "Wednesday", startTime: "16:00", endTime: "17:30" },
      ],
      learningFormat: "Online",
      rating: 4.8,
      reviewCount: 24,
      students: [tutors[4]._id, tutors[6]._id],
      duration: 8,
    },
    {
      name: "Creative Writing Workshop",
      tutor: tutors[1]._id,
      category: categories[1]._id, // Middle School (index adjusted)
      subject: findSubject("Literature"),
      description:
        "Develop your creative writing skills through guided exercises, peer feedback, and personalized instruction. Ideal for students looking to improve their storytelling abilities.",
      hourlyRate: 45,
      schedule: [
        { day: "Tuesday", startTime: "17:00", endTime: "18:30" },
        { day: "Thursday", startTime: "17:00", endTime: "18:30" },
      ],
      learningFormat: "Online",
      rating: 4.7,
      reviewCount: 18,
      students: [tutors[5]._id, tutors[7]._id],
      duration: 6,
    },
    {
      name: "Physics Fundamentals",
      tutor: tutors[2]._id,
      category: categories[2]._id, // High School
      subject: findSubject("Physics"),
      description:
        "A foundational course in physics covering mechanics, thermodynamics, electricity, and magnetism. Includes problem-solving techniques and practical applications.",
      hourlyRate: 55,
      schedule: [
        { day: "Monday", startTime: "18:00", endTime: "19:30" },
        { day: "Friday", startTime: "16:00", endTime: "17:30" },
      ],
      learningFormat: "All",
      rating: 4.9,
      reviewCount: 32,
      students: [tutors[4]._id, tutors[6]._id, tutors[7]._id],
      duration: 10,
    },
    {
      name: "Elementary Mathematics",
      tutor: tutors[3]._id,
      category: categories[0]._id, // Primary School (index adjusted)
      subject: findSubject("Mathematics"),
      description:
        "A fun and engaging course designed to build a strong foundation in mathematics for primary school students. Covers basic arithmetic, geometry, and problem-solving skills.",
      hourlyRate: 40,
      schedule: [
        { day: "Tuesday", startTime: "15:00", endTime: "16:00" },
        { day: "Thursday", startTime: "15:00", endTime: "16:00" },
      ],
      learningFormat: "At Home",
      rating: 4.6,
      reviewCount: 15,
      students: [tutors[5]._id],
      duration: 12,
    },
    {
      name: "SAT Preparation Course",
      tutor: tutors[0]._id,
      category: categories[2]._id, // High School
      subject: findSubject("SAT"),
      description:
        "Comprehensive preparation for the SAT exam, covering all sections including math, reading, and writing. Includes practice tests and personalized feedback.",
      hourlyRate: 65,
      schedule: [
        { day: "Saturday", startTime: "10:00", endTime: "12:00" },
        { day: "Sunday", startTime: "10:00", endTime: "12:00" },
      ],
      learningFormat: "Online",
      rating: 4.9,
      reviewCount: 28,
      students: [tutors[6]._id, tutors[7]._id],
      duration: 8,
    },
    {
      name: "Introduction to Programming",
      tutor: tutors[2]._id,
      category: categories[2]._id, // High School
      subject: findSubject("Computer Science"),
      description:
        "Learn the basics of programming using Python. This course covers fundamental concepts like variables, loops, conditions, and functions with hands-on projects.",
      hourlyRate: 55,
      schedule: [
        { day: "Wednesday", startTime: "17:00", endTime: "18:30" },
        { day: "Saturday", startTime: "14:00", endTime: "15:30" },
      ],
      learningFormat: "Online",
      rating: 4.7,
      reviewCount: 20,
      students: [tutors[4]._id, tutors[5]._id],
      duration: 8,
    },
    {
      name: "IELTS Preparation Intensive",
      tutor: tutors[1]._id,
      category: categories[2]._id, // High School
      subject: findSubject("IELTS"),
      description:
        "Intensive preparation for the IELTS exam, focusing on all four sections: listening, reading, writing, and speaking. Includes strategies for scoring higher in each section.",
      hourlyRate: 60,
      schedule: [
        { day: "Monday", startTime: "19:00", endTime: "21:00" },
        { day: "Thursday", startTime: "19:00", endTime: "21:00" },
      ],
      learningFormat: "Online",
      rating: 4.9,
      reviewCount: 25,
      students: [tutors[4]._id, tutors[5]._id, tutors[7]._id],
      duration: 6,
    },
  ];
};

// Sample reviews
const generateReviews = (courses, students) => {
  const reviews = [];

  courses.forEach((course) => {
    // Generate 1-3 reviews per course
    const reviewCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < reviewCount; i++) {
      // Pick a random student who is enrolled in the course
      const studentIndex = Math.floor(Math.random() * students.length);
      const student = students[studentIndex];

      reviews.push({
        course: course._id,
        student: student._id,
        tutor: course.tutor,
        rating: (Math.floor(Math.random() * 10) + 40) / 10, // Random rating between 4.0 and 5.0
        comment: [
          "Excellent course! The tutor explained complex concepts clearly.",
          "Very helpful sessions that improved my understanding significantly.",
          "Great teaching style and engaging content.",
          "The tutor was patient and provided detailed explanations.",
          "Highly recommend this course for anyone struggling with this subject.",
          "The course material was well-structured and easy to follow.",
        ][Math.floor(Math.random() * 6)],
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000
        ), // Random date in the last 90 days
      });
    }
  });

  return reviews;
};

// Sample payments
const generatePayments = (courses, students) => {
  const payments = [];

  courses.forEach((course) => {
    course.students.forEach((studentId) => {
      payments.push({
        student: studentId,
        tutor: course.tutor,
        course: course._id,
        amount: course.hourlyRate * 4, // Assuming payment for 4 sessions
        paymentMethod: ["bank_transfer", "credit_card", "e_wallet", "cash"][
          Math.floor(Math.random() * 4)
        ],
        status: "completed",
        transactionId: `TRX${Math.floor(Math.random() * 10000000)}`,
        paymentDate: new Date(
          Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
        ), // Random date in the last 30 days
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
        ), // Random date in the last 30 days
      });
    });
  });

  return payments;
};

// Sample notifications
const generateNotifications = (users, courses) => {
  const notifications = [];
  const notificationTypes = [
    "session",
    "message",
    "payment",
    "system",
    "course",
  ];

  users.forEach((user) => {
    // Generate 2-5 notifications per user
    const notificationCount = Math.floor(Math.random() * 4) + 2;

    for (let i = 0; i < notificationCount; i++) {
      const type =
        notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      let title = "";
      let message = "";
      let relatedId = null;

      if (courses.length > 0) {
        const courseIndex = Math.floor(Math.random() * courses.length);
        relatedId = courses[courseIndex]._id;

        switch (type) {
          case "course":
            title = "Course Enrollment";
            message = `You have successfully enrolled in ${courses[courseIndex].name}.`;
            break;
          case "payment":
            title = "Payment Successful";
            message = `Your payment for ${courses[courseIndex].name} was successful.`;
            break;
          case "session":
            title = "Session Reminder";
            message = `Reminder: Your session for ${courses[courseIndex].name} is starting soon.`;
            break;
          case "message":
            title = "New Message";
            message = `You have a new message regarding ${courses[courseIndex].name}.`;
            break;
          case "system":
            title = "System Notification";
            message = "Your account has been updated successfully.";
            break;
        }
      }

      notifications.push({
        recipient: user._id,
        type,
        title,
        message,
        relatedId,
        read: Math.random() > 0.7, // 30% chance of being unread
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000
        ), // Random date in the last 14 days
      });
    }
  });

  return notifications;
};

// Generate chat sessions
const generateChatSessions = (tutors, students) => {
  const chatSessions = [];

  // Create chat sessions between tutors and students
  tutors.forEach((tutor) => {
    students.forEach((student) => {
      if (Math.random() > 0.5) {
        // 50% chance of creating a chat session
        const messages = [];
        const messageCount = Math.floor(Math.random() * 8) + 3; // 3-10 messages

        // Generate some sample messages
        for (let i = 0; i < messageCount; i++) {
          const sender = Math.random() > 0.5 ? tutor._id : student._id;
          const timestamp = new Date(Date.now() - (messageCount - i) * 3600000); // Each message one hour apart

          let content = "";
          if (sender.equals(student._id)) {
            content = [
              "Hi, I have a question about the upcoming class.",
              "Could you explain this concept again?",
              "When is our next session?",
              "Thank you for your help!",
              "The last session was very helpful.",
            ][Math.floor(Math.random() * 5)];
          } else {
            content = [
              "Hello! I'd be happy to help you with that.",
              "Our next session is scheduled for Friday at 4 PM.",
              "Do you have any specific questions about the material?",
              "You're welcome! Let me know if you need anything else.",
              "I'm glad you found it helpful. We'll continue from where we left off.",
            ][Math.floor(Math.random() * 5)];
          }

          messages.push({
            sender,
            content,
            timestamp,
          });
        }

        chatSessions.push({
          participants: [tutor._id, student._id],
          messages,
          lastActivity: messages[messages.length - 1].timestamp,
        });
      }
    });
  });

  return chatSessions;
};

// Import data to database
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Course.deleteMany();
    await TutorProfile.deleteMany();
    await StudentProfile.deleteMany();
    await Review.deleteMany();
    await ChatSession.deleteMany();
    await Payment.deleteMany();
    await Notification.deleteMany();
    await Role.deleteMany();

    console.log("Data cleared from database");

    // Create users
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);

    // Map users to their roles
    const tutors = createdUsers.filter((user) => user.role === "tutor");
    const students = createdUsers.filter((user) => user.role === "student");

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`${createdCategories.length} categories created`);

    // Create tutor profiles with proper subject references
    const tutorProfilesData = [];

    // First tutor teaches high school math subjects
    tutorProfilesData.push({
      user: tutors[0]._id,
      biography: tutorProfiles[0].biography,
      experience: tutorProfiles[0].experience,
      hourlyRate: tutorProfiles[0].hourlyRate,
      certifications: tutorProfiles[0].certifications,
      subjects: [
        createdCategories.find((cat) => cat.name === "High School")._id,
      ],
    });

    // Second tutor teaches English and literature
    tutorProfilesData.push({
      user: tutors[1]._id,
      biography: tutorProfiles[1].biography,
      experience: tutorProfiles[1].experience,
      hourlyRate: tutorProfiles[1].hourlyRate,
      certifications: tutorProfiles[1].certifications,
      subjects: [
        createdCategories.find((cat) => cat.name === "Middle School")._id,
        createdCategories.find((cat) => cat.name === "High School")._id,
      ],
    });

    // Third tutor teaches physics and advanced math
    tutorProfilesData.push({
      user: tutors[2]._id,
      biography: tutorProfiles[2].biography,
      experience: tutorProfiles[2].experience,
      hourlyRate: tutorProfiles[2].hourlyRate,
      certifications: tutorProfiles[2].certifications,
      subjects: [
        createdCategories.find((cat) => cat.name === "High School")._id,
      ],
    });

    // Fourth tutor teaches elementary subjects
    tutorProfilesData.push({
      user: tutors[3]._id,
      biography: tutorProfiles[3].biography,
      experience: tutorProfiles[3].experience,
      hourlyRate: tutorProfiles[3].hourlyRate,
      certifications: tutorProfiles[3].certifications,
      subjects: [
        createdCategories.find((cat) => cat.name === "Primary School")._id,
      ],
    });

    const createdTutorProfiles = await TutorProfile.insertMany(
      tutorProfilesData
    );
    console.log(`${createdTutorProfiles.length} tutor profiles created`);

    // Create student profiles and link to users
    const studentProfilesWithUserIds = studentProfiles.map(
      (profile, index) => ({
        ...profile,
        user: students[index]._id,
      })
    );
    const createdStudentProfiles = await StudentProfile.insertMany(
      studentProfilesWithUserIds
    );
    console.log(`${createdStudentProfiles.length} student profiles created`);

    // Create courses
    const coursesData = generateCourses(createdUsers, createdCategories);
    const createdCourses = await Course.insertMany(coursesData);
    console.log(`${createdCourses.length} courses created`);

    // Create reviews
    const reviewsData = generateReviews(createdCourses, students);
    const createdReviews = await Review.insertMany(reviewsData);
    console.log(`${createdReviews.length} reviews created`);

    // Create payments
    const paymentsData = generatePayments(createdCourses, students);
    const createdPayments = await Payment.insertMany(paymentsData);
    console.log(`${createdPayments.length} payments created`);

    // Create chat sessions
    const chatSessionsData = generateChatSessions(tutors, students);
    const createdChatSessions = await ChatSession.insertMany(chatSessionsData);
    console.log(`${createdChatSessions.length} chat sessions created`);

    // Create notifications
    const notificationsData = generateNotifications(
      createdUsers,
      createdCourses
    );
    const createdNotifications = await Notification.insertMany(
      notificationsData
    );
    console.log(`${createdNotifications.length} notifications created`);

    // Create roles
    await Role.insertMany([
      { name: "student", description: "Regular student user" },
      { name: "tutor", description: "Tutor with ability to create courses" },
      { name: "admin", description: "Administrator with full access" },
    ]);
    console.log("Roles created");

    console.log("Sample data imported successfully!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Delete all data from database
const destroyData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Course.deleteMany();
    await TutorProfile.deleteMany();
    await StudentProfile.deleteMany();
    await Review.deleteMany();
    await ChatSession.deleteMany();
    await Payment.deleteMany();
    await Notification.deleteMany();
    await Role.deleteMany();

    console.log("All data destroyed!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Determine if importing or destroying data
if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
