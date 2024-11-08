import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "users",
    },
    
    body: {
      type: String,
      default: "",
    },
    payload: {
      type: Object,
      default: {},
    },
    link: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationModel = mongoose.model("Notification", NotificationSchema);
export const findNotificationCount = async (userId) => {
  let unRead =  await NotificationModel.find({ userId: userId, isRead: false})
  return unRead.length;
}
export default NotificationModel;
