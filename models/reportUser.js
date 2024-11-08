import mongoose from "mongoose";

const { Schema } = mongoose;

const reportUserSchema = new Schema(
  {
    reportedById: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    reportedToId: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: Boolean,
      default: 1,
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

const reportUserModel = mongoose.model("reportUser", reportUserSchema);
export default reportUserModel;
