const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "VND",
  },
  paymentMethod: {
    type: String,
    enum: ["bank_transfer", "e_wallet", "cash", "credit_card"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  transactionId: {
    type: String,
  },
  paymentDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
  },
  receipt: {
    type: String, // URL to receipt document
  },
});

// Add indexes for frequent queries
paymentSchema.index({ student: 1 });
paymentSchema.index({ tutor: 1 });
paymentSchema.index({ course: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
