import mongoose from "mongoose";
const { Schema } = mongoose;

const privacyPolicys = Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    policy: {
      type: String,
      required: true,
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
const privacyPolicyModel = mongoose.model("privacy", privacyPolicys);

export default privacyPolicyModel;
