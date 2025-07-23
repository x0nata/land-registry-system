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
        "document_update_requested",
        "all_documents_validated",
        "payment_made",
        "payment_verified",
        "property_payment_verified",
        "payment_workflow_completed",
        "application_approved",
        "application_rejected",
        "application_updated",
        "status_changed",
        "comment_added",
        // Dispute-related actions
        "dispute_submitted",
        "dispute_assigned",
        "dispute_under_review",
        "dispute_resolved",
        "dispute_rejected",
        "dispute_withdrawn",
        // Transfer-related actions
        "transfer_initiated",
        "transfer_documents_uploaded",
        "transfer_under_review",
        "transfer_approved",
        "transfer_rejected",
        "transfer_completed",
        "transfer_cancelled",
        "ownership_transferred",
        "other",
      ],
      required: [true, "Action type is required"],
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "needs_update", "verified", "documents_validated", "payment_pending", "payment_completed"],
      required: [true, "Status is required"],
    },
    previousStatus: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "needs_update", "verified", "documents_validated", "payment_pending", "payment_completed"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    performedByRole: {
      type: String,
      enum: ["admin", "landOfficer", "user", "system"],
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
