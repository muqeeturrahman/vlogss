import mongoose from "mongoose";

const { Schema } = mongoose;

const ratingSchema = Schema(
  {
    rating: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    review: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

const ratingModel = mongoose.model("rating", ratingSchema);
export default ratingModel;