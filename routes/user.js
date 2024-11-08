import { Router } from "express";
import multer from "multer";
import moment from "moment";
import {uploadImageToS3} from "../validators/generateThumbnail.js"
// const userRouter = express.userRouter();
import {
  signUp,
  verifyCode,
  userProfile,
  login,
  forgetPassword,
  resetPassword,
  resendOtp,
  reportUser,
  logout,
  deleteAccount,
  getReasons,
  changePassword,
  searchUsersByUsername,
  getUserById,
  autoLogin,
  randomUsers,
} from "../controller/userController.js";
// const {
//   validationFunction,
//   signUpValidator,
//   verifyCodeValidator,
//   userProfileValidator,
//   userLoginValidator,
//   forgetPasswordValidator,
//   resetPasswordValidator,
//   resendOtpValidator,
//   reportUserValidator,
// } = require("../validators/validators");
// const userController = require("../controller/userController");
import usersMiddleware from "../middleware/usersMiddleware.js";
export let userRouter = Router();
import { handleMultipartData } from "../validators/multipartData.js";

// multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./uploads/userProfile");
//   },
//   filename: function (req, file, cb) {
//     let string = `${file.originalname}`;
//     string = string.replace(/ /g, "_");
//     cb(null, moment().format("YYYY-MM-DD") + "_" + string);
//   },
// });

// const upload = multer({ storage: storage });

userRouter.route("/signUp").post(signUp);
//   "/signUp",
//   signUpValidator,
//   validationFunction,
//   userController.signUp
// );

userRouter.route("/verifyCode").put(verifyCode);
//   verifyCodeValidator,
//   validationFunction,
//   userController.verifyCode
// );

userRouter
  .route("/userProfile")
  .patch(handleMultipartData.single("image"),userProfile);
// userRouter
//   .route("/userProfile").patch(userProfile);

//   "/userProfile",
//   upload.single("image"),
//   userProfileValidator,
//   validationFunction,
//   userController.userProfile
// );

userRouter.route("/login").post(login);
userRouter.route("/randomUsers").get(randomUsers);

//   "/login",
//   userLoginValidator,
//   validationFunction,
//   userController.login
// );

userRouter.route("/forgetPassword").post(forgetPassword);
//   "/forgetPassword",
//   forgetPasswordValidator,
//   validationFunction,
//   userController.forgetPassword
// );

userRouter.route("/resetPassword").put(resetPassword);
//   "/resetPassword",
//   resetPasswordValidator,
//   validationFunction,
//   userController.resetPassword
// );

userRouter.route("/resendOtp").put(resendOtp);
//   "/resendOtp",
//   resendOtpValidator,
//   validationFunction,
//   userController.resendOtp
// );

userRouter.route("/reportUser").post([usersMiddleware, reportUser]);
//   "/reportUser",
//   usersMiddleware,
//   reportUserValidator,

//   validationFunction,
//   userController.reportUser
// );
userRouter.route("/getReasons").get([usersMiddleware, getReasons]);
// , usersMiddleware, userController.getReasons);

userRouter.route("/logout").post([usersMiddleware, logout]);
// (
//   "/logout",
//   usersMiddleware,
//   userController.logout
// );
userRouter.route("/deleteAccout").put([usersMiddleware, deleteAccount]);
//   "/deleteAccout",
//   usersMiddleware,
//   userController.deleteAccount
// );
userRouter.route("/changePassword").put([usersMiddleware, changePassword]);
//   "/changePassword",
//   usersMiddleware,
//   userController.changePassword
// );
userRouter
  .route("/searchUsesByUsername")
  .get([usersMiddleware, searchUsersByUsername]);

  
//   usersMiddleware,
//   userController.searchUsesByUsername
// );

// module.exports = userRouter;

userRouter
  .route("/getUserById")
  .get([usersMiddleware, getUserById]);
  userRouter.route("/autoLogin/:id").get([usersMiddleware, autoLogin]);