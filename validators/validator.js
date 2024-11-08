import joi from "joi";
export const signUpValidator = joi.object({
  phoneNumber: joi.string().required().messages({
    "string.empty": "Please enter your phone number",
  }),
  password: joi
    .string()
    .messages({
      "string.empty": "Please enter your password.",
    })
    .required(),
  confirmPassword: joi
    .string()
    .messages({
      "string.empty": "Please enter your password.",
    })
    .required(),
  isTermsAndCondition: joi.boolean(),
});

export const verifyOtpValidator = joi.object({
  otpCode: joi.number(),
  phoneNumber: joi.string(),
});
export const userProfileValidator = joi.object({
  fullName: joi.string().required(),
  username: joi.string().required(),
  userId: joi.string().required(),
  screen: joi.string(),
});
export const loginValidator = joi.object({
  phoneNumber: joi.string().required(),
  password: joi.string().required(),
});

export const forgetPasswordValidator = joi.object({
  phoneNumber: joi.string().required(),
});
export const resetPasswordValidator = joi.object({
  phoneNumber: joi.string().required(),
  password: joi.string().required(),
  confirmPassword: joi.string().required(),
});
export const resendOtpValidator = joi.object({
  phoneNumber: joi.string().required(),
});

export const reportUserValidator = joi.object({
  reportedById: joi.string().required(),
  reportedToId: joi.string().required(),
  reason: joi.string().required(),
  description: joi.string().required(),
});
export const changePasswordValidator = joi.object({
  currentPassword: joi.string().required(),
  newPassword: joi.string().required(),
  confirmPassword: joi.string().required(),
});
export const getUserByIdValidator = joi.object({
  _id: joi.string().required(),
});
export const addVideoValidator = joi.object({
  taggedPeople: joi.array(),
  description: joi.string(),
});
export const editVideoValidator = joi.object({
  _id: joi.string().required(),
  taggedPeople: joi.array(),
  description: joi.string(),
});
export const addFriendValidator = joi.object({
  friendId:joi.string().required()
});
export const blockUnBlockFriendValidator = joi.object({
  friendId: joi.string().required(),
  isBlocked:joi.boolean(),
});
// export const acceptRemoveFriendValidator = joi.object({
//   friendId: joi.string().required(),
//   isAccepted:joi.boolean(),
// });

export const unfriendValidator = joi.object({
  friendId:joi.string().required(),
});