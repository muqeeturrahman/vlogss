import mongoose from "mongoose";
const { Schema } = mongoose;
const vlogCommentsSchema = Schema(
  {
    vlogId: {
      type: mongoose.Types.ObjectId,
      ref: "vlog",
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "users",
    },
    vlogComment: {
      type: Schema.Types.String,
      default: null,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const vlogCommentModel = mongoose.model("vlogComment", vlogCommentsSchema);
export default vlogCommentModel;
