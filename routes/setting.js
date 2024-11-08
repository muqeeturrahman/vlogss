import { Router } from "express";
import { changePhoneNumber,verifyOtpChangePassword,notificationToggle,viewTermsAndConditions } from "../controller/settingController.js";
import usersMiddleware from "../middleware/usersMiddleware.js";
// const {
//   changePhoneNumberValidators,
//   verifyOtpChangePhoneNumberValidators,
//   validationFunction,
//   notificationStatusValidators,
// } = require("../validators/validators");

export let settingsRouter = Router();
settingsRouter.route("/changePhoneNumber").put([usersMiddleware,changePhoneNumber]),
  //     usersMiddleware,
  //     changePhoneNumberValidators,
  //     validationFunction,
  //     settingController.changePhoneNumber
  //   );

  settingsRouter.route("/verifyOtpChangePassword").put([usersMiddleware,verifyOtpChangePassword])
//     "/verifyOtpChangePassword",
//     usersMiddleware,
//     verifyOtpChangePhoneNumberValidators,
//     validationFunction,
//     settingController.verifyOtpChangePassword
//   );

settingsRouter.route("/notificationToggle").put([usersMiddleware,notificationToggle])
//   "/notificationToggle",
//   usersMiddleware,
//   notificationStatusValidators,
//   validationFunction,
//   settingController.notificationToggle
// );
settingsRouter
  .route("/viewTermsAndConditions")
  .get([usersMiddleware,viewTermsAndConditions])
  //   usersMiddleware,
  //   settingController.viewTermsAndConditions
  // );

// module.exports = settingsRouter;
