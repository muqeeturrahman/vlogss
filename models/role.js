import mongoose from "mongoose";
const { Schema } = mongoose;
const rolesSchema = Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
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

const role= mongoose.model("roles", rolesSchema);
export default role
