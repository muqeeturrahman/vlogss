// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const helps = Schema(
//   {
//     userId: {
//       type: mongoose.Types.ObjectId,
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//     },
//     message: {
//       type: String,
//       required: true,
//     },
//     status: {
//       type: Boolean,
//       default: 1,
//     },
//   },
//   {
//     timestamp: true,
//   },
// );

// module.exports = mongoose.model("helps", helps);
import mongoose from "mongoose";

const { Schema } = mongoose;

const helpsSchema = Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "users",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: 1,
    },
  },
  {
    timestamp: true,
  }
);

const helpModel = mongoose.model("helps", helpsSchema);

export default helpModel;