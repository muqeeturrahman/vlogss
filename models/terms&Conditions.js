import mongoose from "mongoose";
const { Schema } = mongoose;

const termsAndConditionsSchema = Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    termsAndCondition: {
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

const termsAndConditionsModel = mongoose.model(
  "termsandConditions",
  termsAndConditionsSchema
);
export default termsAndConditionsModel;
