import mongoose from "mongoose";
const { Schema } = mongoose;

const vlogSchema = Schema(
  {
    title: {
      type: Schema.Types.String,
    },
    mediaType: {
      type: Schema.Types.String,
      default: "video",
    },
    mediaUrl: {
      type: Schema.Types.String,
      required: true,
    },
    imageUrl: {
      type: Schema.Types.String,
      required: true,
    },
    thumbnailPath: {
      type: Schema.Types.String,
      // required: true,
    },
    isLiked: {
      type: Schema.Types.Boolean,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "users",
    },
    description: {
      type: Schema.Types.String,
    },
    videoDuration: {
      type: Schema.Types.String,
    },
    taggedPeople: [
      {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "users",
      },
    ],
    privacy: {
      type: Schema.Types.String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  {
    timestamps: true,
  }
);

const vlogModel = mongoose.model("vlog", vlogSchema);

export default vlogModel;
