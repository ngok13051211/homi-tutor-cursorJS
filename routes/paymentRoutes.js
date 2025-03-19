const express = require("express");
const {
  getPayments,
  getUserPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
  deletePayment,
} = require("../controllers/paymentController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// Admin only routes
router.get("/", auth, checkRole(["admin"]), getPayments);
router.put("/:id", auth, checkRole(["admin"]), updatePaymentStatus);
router.delete("/:id", auth, checkRole(["admin"]), deletePayment);

// User routes
router.get("/user", auth, getUserPayments);
router.get("/:id", auth, getPaymentById);

// Student only routes
router.post("/", auth, checkRole(["student"]), createPayment);

module.exports = router;
