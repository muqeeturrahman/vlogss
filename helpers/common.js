import bcrypt from "bcrypt";
import roleModel from "../models/role.js";
import usersModel from "../models/users.js";
import multer from "multer";
import moment from "moment";
import { validation } from "./responseApi.js";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";

const checkMongooseId = (id) => mongoose.Types.ObjectId.isValid(id);

const hashPasswords = async (plaintextPassword) => {
  const hash = await bcrypt.hash(plaintextPassword, 10);
  return hash;
};

const comparePassword = async (plaintextPassword, hash) => {
  console.log("plaintextPassword", plaintextPassword);
  console.log("hash", hash);
  return await bcrypt.compare(plaintextPassword, hash);
};

const getRoleId = async (roleName) => {
  const role = await roleModel.findOne({ role: roleName });
  return role._id;
};

const checkIdExists = async (modelName, _id) => {
  const exists = await modelName.findOne({
    _id: new mongoose.Types.ObjectId(_id),
    status: 1,
  });

  return exists;
};

const generateRandomNumber = async () => {
  let minm = 1000;
  let maxm = 9999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
};

const isOtpCodeExpire = async (phoneNumber, otpGenerateDateTime) => {
  const currentTimestamp = new Date();
  const timeDifference = currentTimestamp - otpGenerateDateTime;
  console.log("timeDifference", timeDifference);
  if (!(timeDifference <= process.env.OTP_EXPIRY_TIME)) {
    await usersModel.updateOne(
      { phoneNumber, status: 1 },
      {
        $set: {
          isOtpExpire: 1,
        },
      }
    );
  }

  return Boolean(timeDifference <= process.env.OTP_EXPIRY_TIME);
};

export {
  hashPasswords,
  comparePassword,
  getRoleId,
  checkIdExists,
  generateRandomNumber,
  isOtpCodeExpire,
  checkMongooseId,
};
