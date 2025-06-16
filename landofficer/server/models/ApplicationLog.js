import mongoose from "mongoose";

const applicationLogSchema = new mongoose.Schema(
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
    action: {
      type: String,
      enum: [
        "application_submitted",
        "document_uploaded",
        "document_verified",
        "document_rejected",
        "payment_made",
        "payment_verified",
        "application_approved",
        "application_rejected",
        "application_updated",
        "status_changed",
        "comment_added",
        "other",
      ],
      required: [true, "Action type is required"],
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "needs_update"],
      required: [true, "Status is required"],
    },
    previousStatus: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "needs_update"],
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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Add index for faster queries
applicationLogSchema.index({ property: 1 });
applicationLogSchema.index({ user: 1 });
applicationLogSchema.index({ action: 1 });
applicationLogSchema.index({ timestamp: -1 });

const ApplicationLog = mongoose.model("ApplicationLog", applicationLogSchema);

export default ApplicationLog;
