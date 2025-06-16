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
        "under_review",
        "verification_pending",
        "approved",
        "rejected",
        "completed",
        "cancelled"
      ],
      default: "initiated",
    },
    complianceChecks: {
      ethiopianLawCompliance: {
        checked: {
          type: Boolean,
          default: false,
        },
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        checkedDate: {
          type: Date,
        },
        notes: {
          type: String,
        },
      },
      taxClearance: {
        checked: {
          type: Boolean,
          default: false,
        },
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        checkedDate: {
          type: Date,
        },
        notes: {
          type: String,
        },
      },
      fraudPrevention: {
        checked: {
          type: Boolean,
          default: false,
        },
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        checkedDate: {
          type: Date,
        },
        riskLevel: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        notes: {
          type: String,
        },
      },
    },
    approvals: [
      {
        approverRole: {
          type: String,
          enum: ["landOfficer", "admin", "legal_officer"],
          required: true,
        },
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        approvalStatus: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        approvalDate: {
          type: Date,
        },
        notes: {
          type: String,
        },
      },
    ],
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
        performedByRole: {
          type: String,
          enum: ["admin", "landOfficer", "user"],
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
    initiationDate: {
      type: Date,
      default: Date.now,
    },
    completionDate: {
      type: Date,
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

const PropertyTransfer = mongoose.model("PropertyTransfer", propertyTransferSchema);

export default PropertyTransfer;
