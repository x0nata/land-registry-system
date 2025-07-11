import mongoose from "mongoose";

const propertyTransferSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    previousOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    newOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transferType: {
      type: String,
      enum: [
        "sale",
        "inheritance",
        "gift",
        "court_order",
        "government_acquisition",
        "exchange",
        "other"
      ],
      required: [true, "Transfer type is required"],
    },
    transferReason: {
      type: String,
      required: [true, "Transfer reason is required"],
      trim: true,
      maxlength: [1000, "Transfer reason cannot exceed 1000 characters"],
    },
    transferValue: {
      amount: {
        type: Number,
        min: [0, "Transfer value must be positive"],
      },
      currency: {
        type: String,
        enum: ["ETB", "USD"],
        default: "ETB",
      },
    },
    documents: [
      {
        documentType: {
          type: String,
          enum: [
            "sale_agreement",
            "inheritance_certificate", 
            "court_order",
            "id_documents",
            "tax_clearance",
            "valuation_report",
            "other"
          ],
          required: true,
        },
        documentName: {
          type: String,
          required: true,
        },
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        uploadDate: {
          type: Date,
          default: Date.now,
        },
        verificationStatus: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        verificationDate: {
          type: Date,
        },
        verificationNotes: {
          type: String,
        },
      },
    ],
    status: {
      type: String,
      enum: [
        "initiated",
        "documents_pending",
        "documents_submitted",
        "under_review",
        "compliance_check",
        "approved",
        "rejected",
        "completed",
        "cancelled"
      ],
      default: "initiated",
    },
    initiationDate: {
      type: Date,
      default: Date.now,
    },
    completionDate: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    // Compliance and verification fields
    complianceChecks: {
      ethiopianLawCompliance: {
        status: {
          type: String,
          enum: ["pending", "compliant", "non_compliant"],
          default: "pending",
        },
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        checkDate: {
          type: Date,
        },
        notes: {
          type: String,
        },
      },
      taxClearance: {
        status: {
          type: String,
          enum: ["pending", "cleared", "outstanding"],
          default: "pending",
        },
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        checkDate: {
          type: Date,
        },
        notes: {
          type: String,
        },
      },
      fraudPrevention: {
        status: {
          type: String,
          enum: ["pending", "cleared", "flagged"],
          default: "pending",
        },
        riskLevel: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "low",
        },
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        checkDate: {
          type: Date,
        },
        notes: {
          type: String,
        },
      },
    },
    // Payment information for transfer fees
    transferFees: {
      governmentFee: {
        amount: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["pending", "paid", "waived"],
          default: "pending",
        },
        paymentReference: {
          type: String,
        },
      },
      taxAmount: {
        amount: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["pending", "paid", "waived"],
          default: "pending",
        },
        paymentReference: {
          type: String,
        },
      },
      processingFee: {
        amount: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["pending", "paid", "waived"],
          default: "pending",
        },
        paymentReference: {
          type: String,
        },
      },
    },
    // Timeline tracking
    timeline: [
      {
        action: {
          type: String,
          required: true,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
        },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Add indexes for better query performance
propertyTransferSchema.index({ property: 1 });
propertyTransferSchema.index({ previousOwner: 1 });
propertyTransferSchema.index({ newOwner: 1 });
propertyTransferSchema.index({ status: 1 });
propertyTransferSchema.index({ initiationDate: -1 });
propertyTransferSchema.index({ transferType: 1 });

// Update lastUpdated on save
propertyTransferSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const PropertyTransfer = mongoose.model("PropertyTransfer", propertyTransferSchema);

export default PropertyTransfer;
