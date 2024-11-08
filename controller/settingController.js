import usersModel from "../models/users.js";
import { success, errors, validation } from "../helpers/responseApi.js";
import { generateRandomNumber, isOtpCodeExpire } from "../helpers/common.js";
import termsAndConditionsModel from "../models/terms&Conditions.js";
export const changePhoneNumber = async (req, res, next) => {
  try {
    const phoneNumber = req.body.phoneNumber;

    // verify phoneNumber
    const verifyPhoneNumber = await usersModel.findOne({
      phoneNumber: phoneNumber,
      status: true,
    });

    if (verifyPhoneNumber)
      return res.status(400).json(validation("phoneNumber is already taken"));

    // send sms for otp code in future provide by ahmed

    // generate otp code
    const otpCode = await generateRandomNumber();

    await usersModel.updateOne(
      { phoneNumber: req.user.phoneNumber, status: 1 },
      {
        $set: {
          otpCode: otpCode,
          otpGenerateTimeDate: new Date(),
        },
      }
    );

    return res
      .status(200)
      .json(success("OTP sent to registered Phone Number", otpCode, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const verifyOtpChangePassword = async (req, res, next) => {
  try {
    const phoneNumber = req.body.phoneNumber;
    const otpCode = req.body.otpCode;

    // verify otpCode
    const verifyOtpCode = await usersModel.findOne({
      phoneNumber: req.user.phoneNumber,
      otpCode: otpCode,
      status: true,
    });

    if (!verifyOtpCode)
      return res.status(400).json(validation("OTP Code is wrong"));

    // verify otp is expire
    const otpCodeExpire = await isOtpCodeExpire(
      phoneNumber,
      verifyOtpCode?.otpGenerateTimeDate
    );

    if (!otpCodeExpire)
      return res.status(400).json(validation("OTP code has expired"));

    await usersModel.updateOne(
      { phoneNumber: req.user.phoneNumber, otpCode: otpCode, status: 1 },
      {
        $set: {
          phoneNumber: phoneNumber,
        },
      }
    );

    return res
      .status(200)
      .json(success("phone number changed successfully", [], 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const notificationToggle = async (req, res, next) => {
  try {
    console.log("api is running");
    const status = req.body.status;

    // update notification status
    await usersModel.updateOne(
      { phoneNumber: req.user.phoneNumber, status: 1 },
      {
        $set: {
          isNotification: status,
        },
      }
    );

    return res
      .status(200)
      .json(success("notification status updated successfully ", [], 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};
export const viewTermsAndConditions = async (req, res, next) => {
  try {
    const viewTermsAndConditions = await termsAndConditionsModel.find();
    return res
      .status(200)
      .json(
        success(
          "View Terms and Conditions successfully",
          viewTermsAndConditions,
          200
        )
      );
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};
