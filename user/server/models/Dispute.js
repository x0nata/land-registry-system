import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    disputant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    disputeType: {
      type: String,
      enum: [
        "ownership_dispute",
        "boundary_dispute", 
        "documentation_error",
        "fraudulent_registration",
        "inheritance_dispute",
        "other"
      ],
      required: [true, "Dispute type is required"],
    },
    title: {
      type: String,
      required: [true, "Dispute title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Dispute description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    evidence: [
      {
        documentType: {
          type: String,
          enum: ["legal_document", "photo", "witness_statement", "other"],
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
      },
    ],
    status: {
      type: String,
      enum: [
        "submitted",
        "under_review", 
        "investigation",
        "mediation",
        "resolved",
        "rejected",
        "withdrawn"
      ],
      default: "submitted",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolution: {
      decision: {
        type: String,
        enum: ["in_favor_of_disputant", "in_favor_of_respondent", "compromise", "dismissed"],
      },
      resolutionNotes: {
        type: String,
        maxlength: [2000, "Resolution notes cannot exceed 2000 characters"],
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolutionDate: {
        type: Date,
      },
      actionRequired: {
        type: String,
        maxlength: [1000, "Action required cannot exceed 1000 characters"],
      },
    },
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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Add indexes for better query performance
disputeSchema.index({ property: 1 });
disputeSchema.index({ disputant: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ assignedTo: 1 });
disputeSchema.index({ submissionDate: -1 });
disputeSchema.index({ priority: 1, status: 1 });

// Update lastUpdated on save
disputeSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Dispute = mongoose.model("Dispute", disputeSchema);

export default Dispute;
