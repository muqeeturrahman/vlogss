import usersModel from "../models/users.js";
import reportUserModel from "../models/reportUser.js";
import reportReasonModel from "../models/reportReason.js";
import friendModel from "../models/friends.js";
import DeviceModel from "../models/deviceModel.js";
import { uploadImgToS3 } from "../validators/generateThumbnail.js";
import { success, errors, validation } from "../helpers/responseApi.js";
import { signUpValidator } from "../validators/validator.js";
import { delteAccountIo } from "../socketEventListener.js";

import {
  hashPasswords,
  getRoleId,
  checkIdExists,
  generateRandomNumber,
  comparePassword,
  isOtpCodeExpire,
  checkMongooseId,
} from "../helpers/common.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import vlogModel from "../models/vlogModel.js";
import twilio from "twilio"

export const signUp = async (req, res, next) => {
  try {
    // await signUpValidator.validateAsync(req.body);
    console.log(req.body);
    const phoneNumber = req.body.phoneNumber;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const isTermsAndCondition = req.body.isTermsAndCondition;
    const deviceType = req.body.deviceType;
    const deviceToken = req.body.deviceToken;
    const checkUser = await usersModel.findOne({
      phoneNumber: phoneNumber,
      isDeleted: false
    });
    if (checkUser) {
      return res.status(422).json(validation("Number is already in use"));
    }
    const roleId = await getRoleId("Users");
    if (!roleId) return res.status(422).json(validation("role did not exists"));

    // comparing password and confirm password are matched
    if (password !== confirmPassword) {
      return res
        .status(422)
        .json(validation("password and confirm password did not matched"));
    }

    // converting password into hash
    const hashPass = await hashPasswords(password);

    // send sms for otp code in future provide by ahmed

    // generate otp code
    const otpCode = await generateRandomNumber();

    // user data object
    const userData = {
      phoneNumber: phoneNumber,
      password: hashPass,
      otpCode: otpCode,
      roleId: roleId,
      isTermsAndCondition: isTermsAndCondition,
      otpGenerateTimeDate: new Date(),
    };

    // create new User
    const addUser = await new usersModel(userData).save();
    const findDevice = await DeviceModel.findOne({
      userId: addUser._id,
    });
    var updatedDevice;
    if (findDevice) {
      updatedDevice = await DeviceModel.findOneAndUpdate(
        {
          userId: addUser._id,
        },
        {
          deviceType,
          deviceToken,
        },
        {
          new: true,
        }
      );
    } else {
      updatedDevice = await DeviceModel.create({
        userId: addUser._id,
        deviceToken: deviceToken,
        deviceType: deviceType,
      });
    }
    const userLogin = await usersModel.findOneAndUpdate(
      {
        _id: addUser._id,
      },
      {
        $set: {
          devices: updatedDevice._id,
          lastLogin: new Date(),
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(success("OTP sent to registered Phone Number", addUser, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const verifyCode = async (req, res, next) => {
  try {
    // await verifyOtpValidator.validateAsync(req.body);
    const otpCode = req.body.otpCode;
    const phoneNumber = req.body.phoneNumber;

    // verify otp code
    const otpCodeExists = await usersModel.findOne({
      phoneNumber: phoneNumber,
      otpCode: otpCode,
      status: true,
      isDeleted: false
    });

    // if otp code not matched
    if (!otpCodeExists)
      return res.status(400).json(validation("Otp code not matched"));

    // verify otp is expire
    const otpCodeExpire = await isOtpCodeExpire(
      phoneNumber,
      otpCodeExists?.otpGenerateTimeDate
    );

    if (!otpCodeExpire)
      return res.status(400).json(validation("OTP code has expired"));

    await usersModel.updateOne(
      { phoneNumber: phoneNumber, status: 1, isDeleted: false },
      {
        $set: {
          isOtpVerified: 1,
        },
      }
    );

    return res.status(200).json(success("verify code successfully", [], 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const userProfile = async (req, res, next) => {
  try {
    console.log("req.file", req.file);

    // await userProfileValidator.validateAsync(req.body);
    console.log(req.body);
    // console.log("req.basename", req.baseName);

    const fullName = req.body.fullName;
    // const LastName = req.body.LastName;
    const username = req.body.username;
    const userId = req.body.userId ? req.body.userId : req.user._id;
    const screen = req.body.screen;

    // check userId exists
    const isUserExists = await checkIdExists(usersModel, userId);

    if (!isUserExists)
      return res.status(400).json(validation("userId not exists"));

    // check otpVerified is true
    if (!isUserExists.isOtpVerified)
      return res.status(400).json(validation("otp is not verified"));
const user=await usersModel.findOne({username:username})
if (user)
  return res.status(400).json(validation("username already exists"));
    // users object
    const userObj = {
      fullName: fullName,
      // LastName: LastName,
      username: username,
      isProfileCreated: true,
    };
    // console.log(
    //   "process.env.S3_BUCKET_URL + req.file.baseName",
    //   process.env.S3_BUCKET_URL + req.file.originalname
    // );
    // user image url
    if (req.file) {
      // req.body.avatar = `uploads/userProfile/${req.file.filename}`;
      const upload = await uploadImgToS3(req, res, next);
      const avatarUrl = process.env.S3_BUCKET_URL + req.file.originalname;
      console.log("avatarUrl", avatarUrl);

      userObj.avatar = avatarUrl;
      console.log(" userObj.avatar>>", userObj.avatar);
    }
    // console.log("avatar", userObj["avatar"]);

    // update user profile
    const userUpdated = await usersModel.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $set: userObj,
      },
      { returnDocument: "after" }
    );

    // generate jwt token
    const authToken = await jwt.sign(
      JSON.parse(JSON.stringify(userUpdated)),
      process.env.JWTSECRETUSERAPP
    );

    userUpdated.authToken = authToken;

    return res
      .status(200)
      .json(success(`User profile ${screen}  successfully`, userUpdated, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const login = async (req, res, next) => {
  try {
    // const users = await usersModel.deleteMany({
    //   createdAt: {
    //     $lt: new Date("2024-04-25T00:00:00.000Z")
    //   }
    // });

    // await loginValidator.validateAsync(req.body)
    const username = req.body.username;
    const phoneNumber = req.body.phoneNumber;
    const password = req.body.password;
    // const fcmToken = req.body.fcmToken;
    const deviceType = req.body.deviceType;
    const deviceToken = req.body.deviceToken;
    const filter = {};
    // const vlog = await vlogModel.deleteMany({ mediaUrl: { $regex: "niptuckassets" } });
    if (phoneNumber) {
      filter.phoneNumber = phoneNumber;
    }

    if (username) {
      filter.username = username;
    }
    if (username) {
      filter.isDeleted = isDeleted;
    }

    // check users exists
    const usersExists = await usersModel.findOne({ phoneNumber: phoneNumber, isDeleted: false });
    if (!usersExists)
      return res
        .status(400)
        .json(validation("username or phonenumber not exists"));

    // check user account is deleted or not
    // if (usersExists.isDeleted)
    // return res.status(400).json(validation("your account is deleted"));

    // check otpVerified is true
    if (!usersExists.isOtpVerified) {
      const otpCode = await generateRandomNumber();
      const user = await usersModel.findOneAndUpdate(
        { _id: usersExists._id },
        {
          otpCode: otpCode,
          isOtpExpire: false,
          otpGenerateTimeDate: new Date(),
        }
      );
      return res.status(400).json(
        validation("OTP is not verified", {
          userId: usersExists._id,
          phoneNumber: usersExists.phoneNumber,
          otpCode,
        })
      );
    }
    if (!usersExists.isProfileCreated) {
      return res.status(400).json(
        validation("please complete your Profile", {
          userId: usersExists._id,
        })
      );
    }
    // compare password
    const comparePasswords = await comparePassword(
      password,
      usersExists.password
    );

    if (!comparePasswords) {
      return res.status(400).json(validation("Password is incorrect"));
    }
    const findDevice = await DeviceModel.findOne({
      userId: usersExists._id,
    });
    var updatedDevice;
    if (findDevice) {
      updatedDevice = await DeviceModel.findOneAndUpdate(
        {
          userId: usersExists._id,
        },
        {
          deviceType,
          deviceToken,
        },
        {
          new: true,
        }
      );
    } else {
      updatedDevice = await DeviceModel.create({
        userId: usersExists._id,
        deviceToken: deviceToken,
        deviceType: deviceType,
      });
    }

    const userLogin = await usersModel.findOneAndUpdate(
      {
        _id: usersExists._id,
      },
      {
        $set: {
          devices: updatedDevice._id,
          lastLogin: new Date(),
        },
      },
      {
        new: true,
      }
    );

    const authToken = await jwt.sign(
      JSON.parse(JSON.stringify(userLogin)),
      process.env.JWTSECRETUSERAPP
    );
    userLogin.authToken = authToken;

    return res.status(200).json(success("Login Successful", userLogin, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const forgetPassword = async (req, res, next) => {
  0
  try {

    const phoneNumber = req.body.phoneNumber;

    // verify phoneNumber
    const verifyPhoneNumber = await usersModel.findOne({
      phoneNumber: phoneNumber,
      status: true,
    });
    if (!verifyPhoneNumber)
      return res
        .status(400)
        .json(validation("User already exist with this Phone Number"));

    // send sms for otp code in future provide by ahmed

    // generate otp code
    const otpCode = await generateRandomNumber();

    // update otp code and auto increment how many times user reset password
    await usersModel.updateOne(
      { phoneNumber: phoneNumber, status: 1 },
      {
        $set: {
          otpCode: otpCode,
          isOtpExpire: false,
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

export const resetPassword = async (req, res, next) => {
  try {
    // await resetPasswordValidator.validateAsync(req.body);
    const phoneNumber = req.body.phoneNumber;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const otpCode = req.body.otpCode;

    // verify otp code
    const verifyOtpCode = await usersModel.findOne({
      phoneNumber: phoneNumber,
      isOtpVerified: 1,
      status: true,
    });

    if (!verifyOtpCode)
      return res.status(400).json(validation("otp code is not verified"));

    // comparing password and confirm password are matched
    if (password !== confirmPassword) {
      return res
        .status(422)
        .json(validation("password and confirm password did not matched"));
    }

    // converting password into hash
    const hashPass = await hashPasswords(password);

    // update password and auto increment how many times user reset password
    await usersModel.updateOne(
      { phoneNumber: phoneNumber, status: true },
      {
        $set: {
          $inc: { resetPasswordCount: 1 },
          password: hashPass,
        },
      }
    );

    return res
      .status(200)
      .json(success("Password reset successfully", [], 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    // await resendOtpValidator.validateAsync(req.body)
    const phoneNumber = req.body.phoneNumber;

    // verify phonenumber
    const verifyPhoneNumber = await usersModel.findOne({
      phoneNumber: phoneNumber,
      status: true,
      isDeleted: false,
    });

    if (!verifyPhoneNumber)
      return res.status(400).json(validation("Phone Number didnt exists"));

    // send sms for otp code in future provide by ahmed

    // generate otp code
    const otpCode = await generateRandomNumber();

    // update otpCode
    await usersModel.updateOne(
      { phoneNumber: phoneNumber, status: 1, isDeleted: false },
      {
        $set: {
          otpCode: otpCode,
          isOtpExpire: 0,
          otpGenerateTimeDate: new Date(),
        },
      }
    );

    return res
      .status(200)
      .json(success("OTP resent successfully", otpCode, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const reportUser = async (req, res, next) => {
  try {
    // await reportUserValidator.validateAsync(req.body)
    const { reportedToId, reason, description } = req.body;

    const verifyIsUserReportAlready = await reportUserModel.findOne({
      reportedById: req.user._id,
      reportedToId: reportedToId,
      status: 1,
    });

    if (verifyIsUserReportAlready)
      return res.status(422).json(validation("This User is already reported"));

    const reportUser = await reportUserModel.create({
      reportedById: req.user._id,
      reportedToId,
      reason,
      description,
    });

    return res
      .status(200)
      .json(success("User is reported successfully", reportUser, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const logout = async (req, res, next) => {
  try {
    // Generate a new token with an immediate expiration
    jwt.sign({ _id: req.user._id }, process.env.JWTSECRETUSERAPP, {
      expiresIn: "1m",
    });

    // update user logout time
    await usersModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
      {
        $set: {
          lastLogout: new Date(),
          devices: null
        },
      }
    );

    return res.status(200).json(success("Logout Successful", [], 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    // update user delete account status
    console.log("userid>>",req.user._id);
    
    await usersModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
      {
        $set: {
          isDeleted: true,
        },
      }
    );
  
    return res
      .status(200)
      .json(success("Your account has been deleted successfully", [], 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const getReasons = async (req, res, next) => {
  try {
    const viewReasons = await reportReasonModel
      .find({ status: 1 })
      .select("reason");
    return res
      .status(200)
      .json(success("view Reasons successfully", viewReasons, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const changePassword = async (req, res, next) => {
  try {
    // await changePasswordValidator.validateAsync(req.body)
    const { currentPassword, newPassword, confirmPassword } = req.body;
    var user = await usersModel.findById(req.user._id);
    console.log("USER", user);

    console.log("currentPassword", currentPassword);
    const comparePasswords = await comparePassword(
      currentPassword,
      user.password
    );
    //  password, usersExists.password;

    if (!comparePasswords) {
      return res.status(400).json(validation("Existing password is incorrect"));
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json(validation("your password does not match"));
    }
    const hashPass = await hashPasswords(newPassword);
    const updatedPassword = await usersModel.findOneAndUpdate(
      { _id: user._id },
      { password: hashPass },
      { new: true }
    );
    return res
      .status(200)
      .json(success("password changed successfully", updatedPassword, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const searchUsersByUsername = async (req, res, next) => {
  try {
    const deleteFriend = await friendModel.deleteMany({
      isRequest: false,
      isAccepted: false,
      isBlocked: false,
    });
    const regexPattern = new RegExp(req.query.username, "i");
    const users = await usersModel.aggregate([
      {
        $match: {
          $and: [
            { username: { $regex: regexPattern } },
            { username: { $ne: req.user.username } },
            { isDeleted: false }
          ],
        },
      },
      {
        $lookup: {
          from: "friends",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$userId", "$$userId"] },
                        {
                          $eq: [
                            "$friendId",
                            new mongoose.Types.ObjectId(
                              req.user._id.toString()
                            ),
                          ],
                        },
                      ],
                    },
                    {
                      $and: [
                        {
                          $eq: [
                            "$userId",
                            new mongoose.Types.ObjectId(
                              req.user._id.toString()
                            ),
                          ],
                        },
                        { $eq: ["$friendId", "$$userId"] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "friendData",
        },
      },
      {
        $addFields: {
          friendData: { $ifNull: ["$friendData", []] }, // Replace null with empty array if no matches found
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          _id: 1,
          avatar: 1,
          friendData: {
            friendId: 1,
            userId: 1,
            isAccepted: 1,
            isRequest: 1,
            isUnFriend: 1,
            isBlocked: 1
          },
        },
      },
    ]);
    let filteredData = users.filter((user) => {
      // Keep the user if their friendData array is either empty or all entries have isBlocked === false
      return user.friendData.every((friend) => friend.isBlocked === false);
    });

       if (!users || users.length === 0) {
      return res.status(400).json(validation("No user found"));
    }

    // Check if all friendData objects are null
    // const allFriendDataNull = users.every((user) =>
    //   user.friendData.every((fd) => fd === null)
    // );
    // if (allFriendDataNull) {
    //   // Handle case where all friendData objects are null
    //   users.forEach((user) => {
    //     user.friendData = []; // Set friendData to empty array
    //   });
    // }

    return res.status(200).json(success("users", filteredData, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const getUserById = async (req, res, next) => {
  try {
    // await getUserByIdValidator.validateAsync(req.body)
    const userId = req.body._id;
    const blockedUsers = await friendModel.find({
      $or: [
        { userId, isBlocked: true },
        { friendId: userId, isBlocked: true },
      ],
    });
    console.log("Blocked Users:", blockedUsers);

    // console.log("Filtered Block IDs:", filteredblockIds);
    const filteredblockIds = blockedUsers.reduce((ids, user) => {
      if (
        user.userId.toString() !== userId.toString() &&
        !ids.includes(user.userId.toString())
      ) {
        ids.push(user.userId.toString());
      }
      if (
        user.friendId.toString() !== userId.toString() &&
        !ids.includes(user.friendId.toString())
      ) {
        ids.push(user.friendId.toString());
      }
      return ids;
    }, []);
    const myProfile = await usersModel.aggregate([

      {
        $match: { _id: new mongoose.Types.ObjectId(req.body._id) },
      },
      {
        $lookup: {
          from: "vlogs",
          localField: "_id",
          foreignField: "userId",
          as: "videos",
        },
      },
      {
        $lookup: {
          from: "vlogs",
          localField: "_id",
          foreignField: "taggedPeople",
          as: "taggedVideos",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "taggedVideos.userId",
          foreignField: "_id",
          as: "taggedUsers",
        },
      },
      {
        $lookup: {
          from: "vloglikes",
          localField: "_id",
          foreignField: "userId",
          as: "likedVlogs",
        },
      },
      {
        $lookup: {
          from: "vloglikes",
          localField: "videos._id",
          foreignField: "vlogId",
          as: "Likes",
        },
      },
      {
        $lookup: {
          from: "vloglikes",
          localField: "taggedVideos._id",
          foreignField: "vlogId",
          as: "vlogLikes",
        },
      },
      {
        $lookup: {
          from: "vlogcomments",
          localField: "videos._id",
          foreignField: "vlogId",
          as: "Comments",
        },
      },
      {
        $addFields: {
          videos: {
            $map: {
              input: "$videos",
              as: "video",
              in: {
                $mergeObjects: [
                  "$$video",
                  {
                    isLiked: { $in: ["$$video._id", "$likedVlogs.vlogId"] },
                    likeCount: {
                      $size: {
                        $filter: {
                          input: "$Likes",
                          as: "like",
                          cond: { $eq: ["$$video._id", "$$like.vlogId"] },
                        },
                      },
                    },
                    commentsCount: {
                      $size: {
                        $filter: {
                          input: "$Comments",
                          as: "comments",
                          cond: { $eq: ["$$video._id", "$$comments.vlogId"] },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          taggedVideos: {
            $map: {
              input: "$taggedVideos",
              as: "taggedVideo",
              in: {
                $mergeObjects: [
                  "$$taggedVideo",
                  {
                    isLiked: {
                      $in: ["$$taggedVideo._id", "$likedVlogs.vlogId"],
                    },
                    likeCount: {
                      $size: {
                        $filter: {
                          input: "$vlogLikes",
                          as: "like",
                          cond: { $eq: ["$$taggedVideo._id", "$$like.vlogId"] },
                        },
                      },
                    },
                    commentsCount: {
                      $size: {
                        $filter: {
                          input: "$Comments",
                          as: "comments",
                          cond: {
                            $eq: ["$$taggedVideo._id", "$$comments.vlogId"],
                          },
                        },
                      },
                    },
                    userId: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$taggedUsers",
                            as: "user",
                            cond: {
                              $eq: ["$$user._id", "$$taggedVideo.userId"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          username: 1,
          avatar: 1,
          videos: {
            _id: 1,
            title: 1,
            userId: 1,
            mediaType: 1,
            mediaUrl: 1,
            imageUrl: 1,
            taggedPeople: 1,
            description: 1,
            videoDuration: 1,
            createdAt: 1,
            updatedAt: 1,
            isLiked: 1,
            likeCount: 1,
            commentsCount: 1,
          },
          taggedVideos: {
            $filter: {
              input: "$taggedVideos",
              as: "taggedVideo",
              cond: {
                $not: {
                  $in: [
                    "$$taggedVideo.userId._id",
                    filteredblockIds.map(
                      (id) => new mongoose.Types.ObjectId(id)
                    ),
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json(success("User", myProfile, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};



export const autoLogin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await usersModel.findOne({ _id: id, isDeleted: false })
    const authToken = await jwt.sign(
      JSON.parse(JSON.stringify(user)),
      process.env.JWTSECRETUSERAPP
    );
    user.authToken = authToken;
    return res.status(200).json(success("autoLogin", user, 200));

  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
}

export const randomUsers = async (req, res, next) => {
  try {
    const currentPage = parseInt(req.query.currentPage) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    // const result = await usersModel.deleteMany({ $or: [{ avatar: null }, { avatar: { $exists: false } }] });
    // const del = await usersModel.deleteMany({ avatar: /^uploads/ }); //delete that starts from upload
    const skipCount = (currentPage - 1) * itemsPerPage;
    const users = await usersModel.aggregate([
      { $match: { isDeleted: false } },
      { $sample: { size: itemsPerPage } },
      { $skip: skipCount },
      { $project: { username: 1, fullName: 1, avatar: 1 } }
    ]);
    return res.status(200).json(success("users", users, 200));
  }
  catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
}