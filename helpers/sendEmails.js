import nodemailer from "nodemailer";
import emailConfig from "../config/emailConfig.js";

const transporter = nodemailer.createTransport(emailConfig);

const sendEmail = (to, subject, content, next) => {
  try {
    const message = {
      from: {
        name: process.env.MAIL_FROM_NAME,
        address: process.env.MAIL_USERNAME,
      },
      to,
      subject,
      html: content,
    };

    const result = transporter.sendMail(message, next);
    return result;
  } catch (error) {
    console.error(error);
  }
};

export default sendEmail;
