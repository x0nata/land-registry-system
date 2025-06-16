import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    currency: {
      type: String,
      default: "ETB", // Ethiopian Birr
      enum: ["ETB", "USD"],
    },
    paymentType: {
      type: String,
      enum: ["registration_fee", "tax", "transfer_fee", "other"],
      required: [true, "Payment type is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["cbe_birr", "telebirr", "credit_card", "bank_transfer", "cash"],
      required: [true, "Payment method is required"],
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values to be "unique"
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    receiptUrl: {
      type: String,
    },
    notes: {
      type: String,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verificationDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Add index for faster queries
paymentSchema.index({ property: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
// Note: transactionId already has a unique index from the schema definition

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
