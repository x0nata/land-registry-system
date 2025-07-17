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
      enum: ["registration_fee", "tax", "transfer_fee", "penalty", "service_fee", "other"],
      required: [true, "Payment type is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["cbe_birr", "telebirr", "chapa", "credit_card", "bank_transfer", "cash"],
      required: [true, "Payment method is required"],
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values to be "unique"
    },
    // Ethiopian payment method specific fields
    paymentMethodDetails: {
      // For CBE Birr
      cbeAccountNumber: {
        type: String,
        sparse: true,
      },
      cbeTransactionRef: {
        type: String,
        sparse: true,
      },
      // For TeleBirr
      telebirrPhoneNumber: {
        type: String,
        sparse: true,
      },
      telebirrTransactionId: {
        type: String,
        sparse: true,
      },
      // For Chapa (existing)
      chapaTransactionRef: {
        type: String,
        sparse: true,
      },
      chapaCheckoutUrl: {
        type: String,
        sparse: true,
      },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    completedDate: {
      type: Date,
    },
    // Receipt and documentation
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    receiptUrl: {
      type: String,
    },
    receiptGenerated: {
      type: Boolean,
      default: false,
    },
    // Fee breakdown
    feeBreakdown: {
      baseFee: {
        type: Number,
        default: 0,
      },
      processingFee: {
        type: Number,
        default: 0,
      },
      taxAmount: {
        type: Number,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
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
    // Payment attempt tracking
    attemptCount: {
      type: Number,
      default: 1,
    },
    lastAttemptDate: {
      type: Date,
      default: Date.now,
    },
    // Refund information
    refundReason: {
      type: String,
    },
    refundDate: {
      type: Date,
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refundAmount: {
      type: Number,
      min: [0, "Refund amount must be positive"],
    },
  },
  { timestamps: true }
);

// Add indexes for faster queries
paymentSchema.index({ property: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ paymentType: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ receiptNumber: 1 });
// Note: transactionId already has a unique index from the schema definition

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toLocaleString()} ${this.currency}`;
});

// Virtual for payment status display
paymentSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
    cancelled: 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Method to generate receipt number
paymentSchema.methods.generateReceiptNumber = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();

  this.receiptNumber = `RCP-${year}${month}${day}-${random}`;
  return this.receiptNumber;
};

// Method to mark payment as completed
paymentSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedDate = new Date();
  if (!this.receiptNumber) {
    this.generateReceiptNumber();
  }
  return this.save();
};

// Method to calculate total with breakdown
paymentSchema.methods.calculateTotal = function() {
  const breakdown = this.feeBreakdown;
  const total = (breakdown.baseFee || 0) +
                (breakdown.processingFee || 0) +
                (breakdown.taxAmount || 0) -
                (breakdown.discountAmount || 0);

  breakdown.totalAmount = total;
  this.amount = total;
  return total;
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(userId = null) {
  const matchStage = userId ? { user: mongoose.Types.ObjectId(userId) } : {};

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);

  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    averageAmount: 0
  };
};

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
