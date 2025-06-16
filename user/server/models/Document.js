import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentType: {
      type: String,
      enum: [
        "title_deed",
        "id_copy",
        "application_form",
        "tax_clearance",
        "other",
      ],
      required: [true, "Document type is required"],
    },
    documentName: {
      type: String,
      required: [true, "Document name is required"],
      trim: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "File ID is required"],
    },
    filename: {
      type: String,
      required: [true, "Filename is required"],
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "needs_update"],
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
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [
      {
        fileId: mongoose.Schema.Types.ObjectId,
        filename: String,
        uploadDate: Date,
        version: Number,
      },
    ],
  },
  { timestamps: true }
);

// Add index for faster queries
documentSchema.index({ property: 1 });
documentSchema.index({ owner: 1 });
documentSchema.index({ documentType: 1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
