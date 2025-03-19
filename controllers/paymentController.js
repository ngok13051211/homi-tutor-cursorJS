const { Payment, Course, User } = require("../models");

/**
 * Get all payments
 * @route GET /api/payments
 * @access Private (Admin only)
 */
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate({
        path: "student",
        select: "name email",
      })
      .populate({
        path: "tutor",
        select: "name email",
      })
      .populate({
        path: "course",
        select: "name",
      })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user payments (student or tutor)
 * @route GET /api/payments/user
 * @access Private
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === "student") {
      query.student = userId;
    } else if (userRole === "tutor") {
      query.tutor = userId;
    }

    const payments = await Payment.find(query)
      .populate({
        path: "student",
        select: "name email profilePicture",
      })
      .populate({
        path: "tutor",
        select: "name email profilePicture",
      })
      .populate({
        path: "course",
        select: "name hourlyRate",
      })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get payment by ID
 * @route GET /api/payments/:id
 * @access Private
 */
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: "student",
        select: "name email profilePicture",
      })
      .populate({
        path: "tutor",
        select: "name email profilePicture",
      })
      .populate({
        path: "course",
        select: "name hourlyRate description",
      });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if the user is authorized to view this payment
    if (
      payment.student._id.toString() !== req.user._id.toString() &&
      payment.tutor._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this payment" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new payment
 * @route POST /api/payments
 * @access Private (Student only)
 */
const createPayment = async (req, res) => {
  try {
    const { courseId, paymentMethod, description } = req.body;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Create payment
    const payment = await Payment.create({
      student: req.user._id,
      tutor: course.tutor,
      course: course._id,
      amount: course.hourlyRate * course.duration, // Assuming hourlyRate is per session and duration is number of sessions
      paymentMethod,
      status: "pending",
      description,
      createdAt: Date.now(),
    });

    if (payment) {
      // Add student to course if not already enrolled
      if (!course.students.includes(req.user._id)) {
        course.students.push(req.user._id);
        await course.save();
      }

      res.status(201).json(payment);
    } else {
      res.status(400).json({ message: "Invalid payment data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update payment status
 * @route PUT /api/payments/:id
 * @access Private (Admin only)
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const { status, transactionId } = req.body;

    // Update payment status
    payment.status = status || payment.status;

    if (status === "completed") {
      payment.paymentDate = Date.now();
    }

    if (transactionId) {
      payment.transactionId = transactionId;
    }

    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a payment
 * @route DELETE /api/payments/:id
 * @access Private (Admin only)
 */
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await payment.remove();
    res.json({ message: "Payment removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPayments,
  getUserPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
  deletePayment,
};
