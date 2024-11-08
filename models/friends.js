// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const friends = Schema(
//   {
//     userId: {
//       type: mongoose.Types.ObjectId,
//       required: true,
//       ref: "users",
//     },
//     friendId: {
//       type: mongoose.Types.ObjectId,
//       required: true,
//       ref: "users",
//     },
//     status: {
//       type: Number,
//       required: true,
//       default: 1,
//     },
//     isBlocked: {
//       type: Boolean,
//       default: 0,
//     },
//     blockedByAdmin: {
//       type: Boolean,
//       default: 0,
//     },
//     isAccepted: {
//       type: Boolean,
//     },
//     isUnFriend: {
//       type: Boolean,
//     },
//     isRequest: {
//       type: Boolean,
//     },
//   },
//   {
//     timestamps: true, // This will add createdAt and updatedAt fields
//   }
// );

// // Create User model
// module.exports = mongoose.model("friends", friends);
import mongoose from "mongoose";

const { Schema } = mongoose;

const friendsSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "users",
    },
    friendId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "users",
    },
    status: {
      type: Number,
      required: true,
      default: 1,
    },
    Block_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "users",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedByAdmin: {
      type: Boolean,
      default: false,
    },
    isAccepted: {
      type: Boolean,
    },
    isUnFriend: {
      type: Boolean,
    },
    isRequest: {
      type: Boolean,
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

// Create Friend model
const friendModel = mongoose.model("friends", friendsSchema);

export default friendModel;
