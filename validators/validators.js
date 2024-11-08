import { check, body } from "express-validator";
import mongoose from "mongoose";
import usersModel from "../models/users.js";
import roleModel from "../models/role.js";

// custom validators

const isUsernameTaken = async (value, { req }) => {
  const existingUser = await usersModel.findOne({
    _id: { $ne: mongoose.Types.ObjectId(req.body.userId) },
    username: value,
    status: 1,
  });
  return existingUser
    ? Promise.reject("Username is already taken")
    : Promise.resolve();
};

const noSpacesInPhoneNumber = (value) => {
  if (/\s/.test(value)) {
    throw new Error("Phone number cannot contain spaces");
  }
  return true;
};

const allowedScreens = ["add", "update"];

const validatePhoneNumber = check("phoneNumber", "phoneNumber is required")
  .not()
  .isEmpty()
  .isString()
  .custom(noSpacesInPhoneNumber);

const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value))
    throw new Error("Object Id must be valid");
  return true;
};

const friendIdValidator = check("friendId")
  .notEmpty()
  .withMessage("friendId is required")
  .custom((value) => isValidObjectId(value))
  .custom((value, { req }) => value !== req.user._id.toString())
  .withMessage("friendId must be different from UserId");

export const validationFunction = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// users validators
export const signUpValidator = [
  check("phoneNumber", "phoneNumber is required")
    .not()
    .isEmpty()
    .isString()
    .custom(noSpacesInPhoneNumber)
    .custom(async (value) => {
      const existingPhoneNumber = await usersModel.findOne({
        phoneNumber: value,
        status: 1,
      });
      if (existingPhoneNumber) throw new Error("Phone Number is already taken");
      return true;
    }),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),
  check("confirmPassword")
    .isLength({ min: 8 })
    .withMessage("Confirm Password must be at least 8 characters long."),
  check("isTermsAndCondition", "isTermsAndCondition  is required")
    .not()
    .isEmpty()
    .toBoolean()
    .isBoolean()
    .custom((value) => {
      if (value !== true)
        throw new Error("Please accept our Terms of Service & Privacy Policy");
      return true;
    }),
];

export const verifyCodeValidator = [
  check("otpCode", "otpCode is required").not().isEmpty().isNumeric(),
  validatePhoneNumber,
];

export const userProfileValidator = [
  body("image").custom((value, { req }) => {
    if (req.file) {
      if (req.file.size > 1024 * 1024)
        throw new Error("File size exceeds 1MB limit");
      const allowedExtensions = ["jpg", "jpeg", "png"];
      const fileExtension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();
      if (!allowedExtensions.includes(fileExtension))
        throw new Error("Only JPG, JPEG, PNG files are allowed");
    }
    return true;
  }),
  check("userId", "userId is required").not().isEmpty(),
  check("fullName", "fullName is required").not().isEmpty().isString(),
  check("username", "username is required")
    .not()
    .isEmpty()
    .isString()
    .custom(isUsernameTaken),
  check("screen", "screen is required")
    .not()
    .isEmpty()
    .isString()
    .isIn(allowedScreens)
    .withMessage(`Screen name must be one of: ${allowedScreens.join(", ")}`),
];

export const userLoginValidator = [
  body("username").optional(),
  body("phoneNumber").optional(),
  body().custom((value, { req }) => {
    if (!req.body.username && !req.body.phoneNumber)
      throw new Error("At least one of username or phoneNumber is required");
    return true;
  }),
  check("password", "password is required").not().isEmpty(),
  check("fcmToken", "fcmToken is required").optional(),
];

export const forgetPasswordValidator = [validatePhoneNumber];

export const resetPasswordValidator = [
  validatePhoneNumber,
  check("password", "password is required").not().isEmpty(),
  check("confirmPassword", "confirmPassword is required").not().isEmpty(),
];

export const resendOtpValidator = [validatePhoneNumber];

// setting validators

export const changePhoneNumberValidators = [validatePhoneNumber];

export const verifyOtpChangePhoneNumberValidators = [
  validatePhoneNumber,
  check("otpCode", "otpCode is required").not().isEmpty(),
];

export const notificationStatusValidators = [
  check("status", "status is required").not().isEmpty().isBoolean(),
];

// friends validator

export const addFriendValidators = [friendIdValidator];

export const getFriendsValidators = [
  check("status")
    .notEmpty()
    .withMessage("status is required")
    .custom((value) => value == 0 || value == 1)
    .withMessage("Boolean must ne o or 1"),
];

export const blockUnBlockFriendValidators = [
  friendIdValidator,
  check("status")
    .notEmpty()
    .withMessage("status is required")
    .custom((value) => value == 0 || value == 1)
    .withMessage("Boolean must ne o or 1"),
];

export const acceptRemoveFriendValidators = [
  friendIdValidator,
  check("status")
    .notEmpty()
    .withMessage("status is required")
    .custom((value) => value == 0 || value == 1)
    .withMessage("Boolean must ne o or 1"),
];

export const unFriendValidators = [friendIdValidator];

export const reportUserValidator = [
  check("reportedToId", "reportedToId is required")
    .not()
    .isEmpty()
    .custom((value) => isValidObjectId(value)),
  check("reasonId", "reasonId is required")
    .not()
    .isEmpty()
    .custom((value) => isValidObjectId(value)),
  check("description", "description is required").not().isEmpty().isString(),
];

// rating validators

export const addHelpValidators = [
  body("image").custom((value, { req }) => {
    if (req.file) {
      if (req.file.size > 1024 * 1024)
        throw new Error("File size exceeds 1MB limit");
      const allowedExtensions = ["jpg", "jpeg", "png"];
      const fileExtension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();
      if (!allowedExtensions.includes(fileExtension))
        throw new Error("Only JPG, JPEG, PNG files are allowed");
    }
    return true;
  }),
  check("name", "name is required").not().isEmpty().isString(),
  check("email", "email is required").not().isEmpty().isEmail(),
  check("message", "message is required").not().isEmpty().isString(),
];

export const adminValidationRules = [
  check("fullName", "fullName is required").not().isEmpty().isString(),
  check("lastName", "lastName is required").not().isEmpty().isString(),
  check("username", "Username is required")
    .not()
    .isEmpty()
    .custom(async (value) => {
      const existingUser = await usersModel.findOne({ username: value });
      if (existingUser) {
        throw new Error("Username is already taken");
      }
      return true;
    }),
  check("phoneNumber", "phoneNumber is required")
    .not()
    .isEmpty()
    .custom(async (value) => {
      const existingUser = await usersModel.findOne({ phoneNumber: value });
      if (existingUser) {
        throw new Error("phoneNumber is already taken");
      }
      return true;
    }),
  check("countryCode", "countryCode is required").not().isEmpty(),
  check("password", "password is required").not().isEmpty(),
  check("confirmPassword", "confirmPassword is required").not().isEmpty(),
];

export const loginAdminValidation = [
  check("username", "username is required").not().isEmpty(),
  check("password", "password is required").not().isEmpty(),
];
export const addPrivacyPolicyValidation = [
  check("policy", "policy is required").not().isEmpty(),
];
export const addReportReasonValidation = [
  check("reason", "reason is required").not().isEmpty().isString(),
];
export const editReportReasonValidation = [
  check("_id", "_id is required")
    .not()
    .isEmpty()
    .custom((value) => isValidObjectId(value)),
];
// roles validators
export const roleValidator = [
  check("role", "Role is required")
    .not()
    .isEmpty()
    .isString()
    .custom(async (value, { req }) => {
      const existingRole = await roleModel.findOne({ role: value });
      if (existingRole) {
        throw new Error("Role is already taken");
      }
      return true;
    }),
];

export const roleById = [
  check("roleId", "roleId is required").not().isEmpty(),
  check("role", "role is required").not().isEmpty(),
];

export const deleteRoleById = [
  check("roleId", "roleId is required").not().isEmpty(),
];
export const addTermsAndConditionValidation = [
  check("termsAndCondition", "termsAndCondition is required")
    .not()
    .isEmpty()
    .isString(),
];
export const userSettingsValidation = [
  check("_id", "_id is required")
    .not()
    .isEmpty()
    .custom((value) => isValidObjectId(value)),
  // check("isNotification", "isNotification must be Boolean").isBoolean(),
];

// export const addHelpValidators = [
//   // Validate file size (in bytes)
//   body("image").custom((value, { req }) => {
//     // Check if the image is available
//     if (req.file) {
//       // Validate file size
//       if (req.file.size > 1024 * 1024) {
//         // 1 MB limit
//         throw new Error("File size exceeds 1MB limit");
//       }

//       // Validate file type
//       const allowedExtensions = ["jpg", "jpeg", "png"];
//       const fileExtension = req.file.originalname
//         .split(".")
//         .pop()
//         .toLowerCase();
//       if (!allowedExtensions.includes(fileExtension)) {
//         throw new Error("Only JPG, JPEG, PNG files are allowed");
//       }
//     }

//     // If the image is not available, it's considered valid
//     return true;
//   }),
//   check("name", "name is required").not().isEmpty().isString(),
//   check("email", "email is required").not().isEmpty().isEmail(),
//   check("message", "message is required").not().isEmpty().isString(),
// ];
