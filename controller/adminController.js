import { success, errors, validation } from "../helpers/responseApi.js";
import roleModel from "../models/role.js";
import usersModel from "../models/users.js";
import vlogModel from "../models/vlogModel.js";
import helpModel from "../models/help.js";
import privacyPolicysModel from "../models/privacyPolicy.js";
import reportReasonModel from "../models/reportReason.js";
import termsAndConditionsModel from "../models/terms&Conditions.js";
import sendEmails from "../helpers/sendEmails.js";
import emailTemplate from "../helpers/emailTemplate.js";
import friendModel from "../models/friends.js";
import NotificationModel from "../models/notificationModel.js";
import {delteAccountIo} from "../socketEventListener.js"
import {
  hashPasswords,
  getRoleId,
  comparePassword,
  checkIdExists,
} from "../helpers/common.js";
import jwt from "jsonwebtoken";
// adminContrller/adminpanel validation pending
export const addAdmin = async (req, res, next) => {
  try {
    console.log("api is hitting");

    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    // get role id
    const roleId = await getRoleId("Super Admin");
    if (!roleId) return res.status(422).json(validation("role did not exists"));

    // comparing password and confirm password are matched
    if (password !== confirmPassword) {
      return res
        .status(422)
        .json(validation("password and confirm password did not matched"));
    }

    // converting password into hash
    const hashPass = await hashPasswords(password);

    // user data object
    const userData = {
      fullName: req.body.fullName,
      username: req.body.username,
      phoneNumber: req.body.phoneNumber,
      otpCode: req.body.otpCode,
      avatar: req.body.avatar,
      countryCode: req.body.countryCode,
      roleId: roleId,
      password: hashPass,
      isAdmin: 1,
    };

    // create new admin
    const addAdminUser = await new usersModel(userData).save();

    return res
      .status(200)
      .json(success("add admin successfully", addAdminUser, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = await usersModel.findOne({
      username: username,
      isAdmin: 1,
      status: 1,
    });

    // check if admin is exists
    if (!userExists) {
      return res.status(422).json(validation("username not found"));
    }

    // comparing password
    const comparePasswords = await comparePassword(
      password,
      userExists.password
    );

    if (!comparePasswords) {
      return res
        .status(422)
        .json(validation("Your old Password Does Not Match."));
    }

    // admin object
    const userObject = {
      name: userExists.name,
      username: userExists.username,
      phoneNumber: userExists.phoneNumber,
      roleId: userExists.roleId,
      countryCode: userExists.countryCode,
      isAdmin: userExists.isAdmin,
      status: userExists.status,
    };

    // generate auth token
    const authToken = await jwt.sign(
      JSON.parse(JSON.stringify(userExists)),
      process.env.JWTSECRETDASHBOARD
    );

    userObject.authToken = authToken;

    return res
      .status(200)
      .json(success("admin login successfully", userObject, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const getHelpAndFeedback = async (req, res, next) => {
  try {
    const getHelp = await helpModel.find();
    return res
      .status(200)
      .json(success("Help Messages by Users", getHelp, 200));
  } catch (error) {
    console.error(error);
    res.status(500).json(errors(error.message, 500));
  }
};
export const addPrivacyPolicy = async (req, res, next) => {
  try {
    console.log("id>>>>>>>>>>>>>>>>>>>>>>>>", req.user);

    // add or update privacy policy
    const filter = { status: 1 };
    const update = {
      $set: { policy: req.body.policy, userId: req.user._id },
    };

    const options = { upsert: true };

    await privacyPolicysModel.updateOne(filter, update, options);

    return res
      .status(200)
      .json(success("Privacy Policy added successfully", [], 200));
  } catch (error) {
    console.error(error);
    res.status(500).json(errors(error.message, 500));
  }
};

export const addReportReason = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const reportReason = await reportReasonModel.create({
      reason,
      userId: req.user._id,
    });
    return res
      .status(200)
      .json(success("reportReason added successfully", reportReason, 200));
  } catch (error) {
    console.error(error);
    res.status(500).json(errors(error.message, 500));
  }
};
export const editReason = async (req, res, next) => {
  try {
    const { user } = req;
    const { reason, _id } = req.body;
    const reportReason = await reportReasonModel.findOneAndUpdate(
      { _id },
      {
        reason,
        userId: req.user._id,
      },
      {
        new: true,
      }
    );
    return res
      .status(200)
      .json(success("reportReason updated successfully", reportReason, 200));
  } catch (error) {
    console.error(error);
    res.status(500).json(errors(error.message, 500));
  }
};

export const deleteReason = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reportReason = await reportReasonModel.findByIdAndDelete(id);
    return res
      .status(200)
      .json(success("reportReason deleted successfully", [], 200));
  } catch (error) {
    console.error(error);
    res.status(500).json(errors(error.message, 500));
  }
};

export const addRole = async (req, res, next) => {
  try {
    // create Role
    console.log("api is hitting");

    const addRole = await new roleModel({ role: req.body.role }).save();

    return res.status(200).json(success("add Role successfully", addRole, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const getRole = async (req, res, next) => {
  try {
    // get all active Role
    const getRole = await roleModel.find({ status: 1 });

    return res.status(200).json(success("get Role successfully", getRole, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const updateRole = async (req, res, next) => {
  try {
    // update role by id

    // check role id exists
    const exists = await checkIdExists(roleModel, req.body.roleId);
    if (!exists)
      return res.status(400).json(validation(`Role id is not exists`));

    // role update query
    const filter = { _id: req.body.roleId };
    const update = {
      $set: {
        role: req.body.role,
      },
    };

    await roleModel.updateOne(filter, update);

    return res.status(200).json(success("Role updated successfully", [], 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    // delete role by id

    // check role id exists
    const exists = await checkIdExists(roleModel, req.body.roleId);
    if (!exists)
      return res.status(400).json(validation(`Role id is not exists`));

    // role update query
    const filter = { _id: req.body.roleId };
    const update = {
      $set: {
        status: 0,
      },
    };

    await roleModel.updateOne(filter, update);

    return res.status(200).json(success("Role deleted successfully", [], 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const addTermsAndCondition = async (req, res, next) => {
  try {
    // add or update termsandConditions

    const filter = { status: 1 };
    const update = {
      $set: {
        termsAndCondition: req.body.termsAndCondition,
        userId: req.user._id,
      },
    };

    const options = { upsert: true };

    await termsAndConditionsModel.updateOne(filter, update, options);
    return res
      .status(200)
      .json(success("Terms and Conditions added successfully", [], 200));
  } catch (error) {
    console.error(error);
    res.status(500).json(errors(error.message, 500));
  }
};

export const viewUsers = async (req, res, next) => {
  try {
    const Users = await usersModel.find().sort({ createdAt: -1 });
    return res.status(200).json(success("View Users", Users, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const manageUsers = async (req, res, next) => {
  try {
    const {
      phoneNumber,
      otpCode,
      roleId,
      countryCode,
      isTermsAndCondition,
      isOtpVerified,
      isNotification,
      status,
    } = req.body;
    const id = req.params.id;

    const manageUsers = await usersModel.findOneAndUpdate(
      { _id: id },
      {
        phoneNumber,
        otpCode,
        roleId,
        countryCode,
        isTermsAndCondition,
        isOtpVerified,
        isNotification,
        status,
      }
    );
    return res.status(200).json(success("ManageUser", manageUsers, 200));
  } catch (err) {
    console.log(err.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const blockAndUnblockUser = async (req, res, next) => {
  try {
    const { isBlockedByAdmin } = req.body;
    const id = req.params.id;
    const User = await usersModel.findOneAndUpdate(
      { _id: id },
      { isBlockedByAdmin },
      { new: true }
    );
    return res.status(200).json(success("Block/Unblock User", User, 200));
  } catch (err) {
    console.log(err.message);
    res.status(500).json(errors(err.message, 500));
  }
};

export const resolveQueries = async (req, res, next) => {
  try {
    const { recipient, userId } = req.body;

    const emailData = "your query has been resolved";
    const emailContent = emailTemplate(emailData);
    const user = await usersModel.findById(userId);
    const title = "Message By Admin";
    const body = `Admin have sent you a message`;
    const payload = {
      type: "customerSupport",
      userId: userId,
    };
    if (user.devices.length > 0 && user.isNotification){
    const notifications = user.devices.map(async (devices) => {
      await sendNotificationWithPayload({
        token:devices.deviceToken,
        body:body,
        data:payload,
        title:title
      })
    });
    await Promise.all(notifications)
  }
      await NotificationModel.create({
        userId: user._id,
        body: body,
        payload: payload,
      });
    sendEmails(recipient, emailContent.subject, emailContent.html, next);
    return res
      .status(200)
      .json(success("An email has been sent to user", [], 200));
  } catch (err) {
    console.log(err.message);
    res.status(500).json(errors(err.message, 500));
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isDeleted } = req.body;

    const User = await usersModel.findByIdAndUpdate(
      id,
      { isDeleted },
      { new: true }
    );
    await delteAccountIo(id)
    return res.status(200).json(success("Block/Unblock User", User, 200));
  } catch (err) {
    console.log(err.message);
    res.status(500).json(errors(err.message, 500));
  }
};

export const userSettings = async (req, res, next) => {
  try {
    const { _id, isNotification } = req.body;
    const userSettings = await usersModel.findOneAndUpdate(
      { _id },
      { isNotification }
    );
    const userFriends = await friendModel.find({
      $or: [{ userId: _id }, { friendId: _id }],
    });

    // const blockedUsers = await friendModel.find({
    //   userId: _id,
    //   isBlocked: true,
    // });
    return res
      .status(200)
      .json(
        success(
          "userSetiings",
          userSettings,
          userFriends,
          /*blockedUsers,*/ 200
        )
      );
  } catch (err) {
    console.log(err.message);
    res.status(500).json(errors(err.message, 500));
  }
};

export const usersData = async (req, res, next) => {
  try {
    const videos = await vlogModel.find({}).populate({
      path: "userId",
      select: "fullName username",
    });

    return res.status(200).json(success("homeScreen", videos, 200));
  } catch (err) {
    console.log(err.message);
    res.status(500).json(errors(err.message, 500));
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Typo: It should be req.params.id, not req.paramas.id
    console.log(id);

    const deleteMedia = await vlogModel.findByIdAndDelete(id);
    if (!deleteMedia) {
      return res.status(400).json(validation("Error deleting post")); // Assuming validation is a function that formats validation error responses
    }

    return res
      .status(200)
      .json(success("Post deleted successfully", deleteMedia, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const videosByDates = async (req, res, next) => {
  const {id}=req.params;
  const videos = await vlogModel
    .find({ userId: id })
    .sort({ createdAt: -1 });
  return res.status(200).json(success("Calendar", videos, 200));
};