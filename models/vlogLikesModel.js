import mongoose from "mongoose";
const { Schema } = mongoose;

const vlogLikeSchema = Schema(
  {
    vlogId: {
      type: mongoose.Types.ObjectId,
      ref: "vlog",
      required: true,
    },

    userId: [
      {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "users",
      },
    ],
    isLiked: {
      type: Schema.Types.Boolean,
    },
  },

  {
    timestamps: true,
  }
);

const vlogLikesModel = mongoose.model("vlogLikes", vlogLikeSchema);
export default vlogLikesModel;

// taggedPeople: [
//       {
//         type: mongoose.Types.ObjectId,
//         required: true,
//         ref: "users",
//       },
//     ],
