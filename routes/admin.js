import { Router } from "express";
import dashboardUsers from "../middleware/adminDashboard.js";
import {
  addAdmin,
  loginAdmin,
  getHelpAndFeedback,
  addPrivacyPolicy,
  addReportReason,
  editReason,
  deleteReason,
  addRole,
  getRole,
  updateRole,
  deleteRole,
  addTermsAndCondition,
  viewUsers,
  manageUsers,
  blockAndUnblockUser,
  resolveQueries,
  deleteUser,
  userSettings,
  usersData,
  deleteVideo,
  videosByDates,
} from "../controller/adminController.js";
import { editVideo } from "../controller/vlogController.js";
export let adminRouter = Router();
adminRouter.route("/addAdmin").post(addAdmin);
adminRouter.route("/loginAdmin").post(loginAdmin);
adminRouter.route("/getHelpAndFeedback").get(getHelpAndFeedback);
adminRouter.route("/addPrivacyPolicy").post([dashboardUsers, addPrivacyPolicy]);
adminRouter.route("/addReportReason").post(addReportReason);
adminRouter.route("/editReportReason").put(editReason);
adminRouter.route("/deleteReportReason/:id").delete(deleteReason);
adminRouter.route("/addRole").post(addRole);
adminRouter.route("/getRole").get(getRole);
adminRouter.route("/updateRole").put(updateRole);
adminRouter.route("/deleteRole").delete(deleteRole);
adminRouter.route("/addTermsAndCondition").post(addTermsAndCondition);
adminRouter.route("/getUsers").get(viewUsers);

adminRouter.route("/manageUsers/:id").put(manageUsers);
adminRouter.route("/blockAndUnblockUser/:id").put(blockAndUnblockUser);
adminRouter.route("/resolveQueries").post(resolveQueries);
adminRouter.route("/deleteUser/:id").put(deleteUser);
adminRouter.route("/userSettings").put(userSettings);
adminRouter.route("/deleteVideo/:id").delete(deleteVideo);
adminRouter.route("/usersVideos").get(usersData);
adminRouter.route("/editVideo").put(editVideo);
adminRouter.route("/calendar/:id").get(videosByDates);
