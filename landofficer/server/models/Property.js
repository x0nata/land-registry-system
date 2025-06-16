import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      kebele: {
        type: String,
        required: [true, "Kebele is required"],
        trim: true,
      },
      subCity: {
        type: String,
        required: [true, "Sub-city is required"],
        trim: true,
      },
      coordinates: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
      },
    },
    plotNumber: {
      type: String,
      required: [true, "Plot number is required"],
      unique: true,
      trim: true,
    },
    area: {
      type: Number,
      required: [true, "Area is required"],
      min: [0, "Area must be a positive number"],
    },
    propertyType: {
      type: String,
      enum: ["residential", "commercial", "industrial", "agricultural"],
      required: [true, "Property type is required"],
    },
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "documents_pending", "documents_validated", "payment_pending", "payment_completed", "under_review", "approved", "rejected"],
      default: "pending",
    },
    documentsValidated: {
      type: Boolean,
      default: false,
    },
    paymentCompleted: {
      type: Boolean,
      default: false,
    },
    chapaTransactionRef: {
      type: String,
      sparse: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: {
      type: String,
    },
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],
  },
  { timestamps: true }
);

// Add index for faster queries
// Note: plotNumber already has a unique index from the schema definition
propertySchema.index({ owner: 1 });
propertySchema.index({ status: 1 });

const Property = mongoose.model("Property", propertySchema);

export default Property;
