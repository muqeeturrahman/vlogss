import mongoose from "mongoose";

const { Schema } = mongoose;

const reportReasonSchema = Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

const reportReasonModel = mongoose.model("reportReason", reportReasonSchema);
export default reportReasonModel;
