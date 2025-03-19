const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");

// Load models
const {
  User,
  Role,
  Category,
  TutorProfile,
  StudentProfile,
  Course,
} = require("./models");

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/homi-tutor",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Sample data
const roles = [
  {
    name: "student",
    permissions: [
      "book_lesson",
      "cancel_lesson",
      "leave_review",
      "send_message",
    ],
    description:
      "Regular student with access to book lessons and leave reviews",
  },
  {
    name: "tutor",
    permissions: [
      "create_course",
      "edit_course",
      "delete_course",
      "send_message",
    ],
    description: "Tutor who can create and manage courses",
  },
  {
    name: "admin",
    permissions: [
      "create_course",
      "edit_course",
      "delete_course",
      "book_lesson",
      "cancel_lesson",
      "leave_review",
      "manage_users",
      "manage_payments",
      "send_message",
    ],
    description: "Administrator with full system access",
  },
];

const categories = [
  {
    name: "Elementary School",
    type: "elementary_school",
    grade: null,
    description: "Courses for elementary school students (grades 1-5)",
    subjects: [
      { name: "Math", description: "Elementary Math curriculum" },
      { name: "Vietnamese", description: "Vietnamese language and reading" },
      { name: "English", description: "English for young learners" },
    ],
  },
  {
    name: "Middle School Grade 6",
    type: "middle_school",
    grade: 6,
    description: "Courses for middle school students in grade 6",
    subjects: [
      { name: "Math", description: "Middle school Mathematics" },
      { name: "Literature", description: "Vietnamese literature" },
      { name: "English", description: "English language" },
      { name: "Physics", description: "Introduction to Physics" },
      { name: "Chemistry", description: "Introduction to Chemistry" },
      { name: "Biology", description: "Introduction to Biology" },
    ],
  },
  {
    name: "High School Grade 10",
    type: "high_school",
    grade: 10,
    description: "Courses for high school students in grade 10",
    subjects: [
      { name: "Math", description: "Advanced Mathematics" },
      { name: "Literature", description: "Advanced Vietnamese literature" },
      { name: "English", description: "Advanced English" },
      { name: "Physics", description: "Physics for high school" },
      { name: "Chemistry", description: "Chemistry for high school" },
      { name: "Biology", description: "Biology for high school" },
      { name: "History", description: "Vietnam and World History" },
      { name: "Geography", description: "Geography studies" },
    ],
  },
  {
    name: "Foreign Languages",
    type: "foreign_languages",
    grade: null,
    description: "Language certification preparation courses",
    subjects: [
      {
        name: "TOEIC",
        description:
          "Test of English for International Communication preparation",
      },
      {
        name: "IELTS",
        description:
          "International English Language Testing System preparation",
      },
    ],
  },
];

const users = [
  {
    name: "Admin User",
    email: "admin@homitutor.com",
    password: "admin123",
    role: "admin",
    profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    name: "John Tutor",
    email: "tutor@homitutor.com",
    password: "tutor123",
    role: "tutor",
    profilePicture: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    name: "Mary Student",
    email: "student@homitutor.com",
    password: "student123",
    role: "student",
    profilePicture: "https://randomuser.me/api/portraits/women/1.jpg",
  },
];

// Import data
const importData = async () => {
  try {
    // Clear existing data
    await Role.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    await TutorProfile.deleteMany();
    await StudentProfile.deleteMany();
    await Course.deleteMany();

    // Create roles
    await Role.insertMany(roles);
    console.log("Roles imported");

    // Create categories
    const categoryDocs = await Category.insertMany(categories);
    console.log("Categories imported");

    // Create users and their profiles
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const newUser = await User.create({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        profilePicture: user.profilePicture,
      });

      if (user.role === "tutor") {
        await TutorProfile.create({
          user: newUser._id,
          biography: `I am ${newUser.name}, an experienced tutor with excellent teaching skills.`,
          subjects: [categoryDocs[0]._id, categoryDocs[1]._id],
          experience: 5,
          certifications: [
            {
              name: "Teaching Certification",
              issuer: "Ministry of Education",
              year: 2018,
              documentUrl: "",
            },
          ],
          hourlyRate: 200000, // 200,000 VND
          rating: 4.5,
          reviewCount: 10,
        });
      } else if (user.role === "student") {
        await StudentProfile.create({
          user: newUser._id,
          learningGoals:
            "I want to improve my grades in school and prepare for university entrance exams.",
          favoriteSubjects: [categoryDocs[1]._id],
          educationLevel: "high_school",
          grade: 10,
          parentName: "Parent Name",
          parentContact: "0987654321",
        });
      }
    }

    console.log("Users and profiles imported");

    // Create sample courses
    const tutor = await User.findOne({ role: "tutor" });
    const mathCategory = await Category.findOne({ "subjects.name": "Math" });
    const englishCategory = await Category.findOne({
      "subjects.name": "English",
    });

    await Course.create({
      name: "High School Math Grade 10",
      tutor: tutor._id,
      category: mathCategory._id,
      subject: "Math",
      description:
        "This course covers all the essential math concepts for 10th grade students.",
      hourlyRate: 200000, // 200,000 VND
      schedule: [
        {
          day: "Monday",
          startTime: "18:00",
          endTime: "20:00",
        },
        {
          day: "Wednesday",
          startTime: "18:00",
          endTime: "20:00",
        },
      ],
      learningFormat: "Online",
      students: [],
      duration: 8, // 8 weeks
      status: "active",
    });

    await Course.create({
      name: "IELTS Preparation",
      tutor: tutor._id,
      category: englishCategory._id,
      subject: "IELTS",
      description:
        "Comprehensive course to prepare for the IELTS exam with target scores of 6.5+.",
      hourlyRate: 250000, // 250,000 VND
      schedule: [
        {
          day: "Tuesday",
          startTime: "19:00",
          endTime: "21:00",
        },
        {
          day: "Saturday",
          startTime: "09:00",
          endTime: "11:00",
        },
      ],
      learningFormat: "All",
      students: [],
      duration: 12, // 12 weeks
      status: "active",
    });

    console.log("Courses imported");
    console.log("Data import completed successfully");

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Delete all data
const destroyData = async () => {
  try {
    await Role.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    await TutorProfile.deleteMany();
    await StudentProfile.deleteMany();
    await Course.deleteMany();

    console.log("Data destroyed successfully");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
