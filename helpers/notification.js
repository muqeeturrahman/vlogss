import FCM from "fcm-node";
import { config } from "dotenv";

config();
console.log("this is the server key", process.env.FIREBASE_SERVER_KEY);
const fcm = new FCM(
  "AAAAKd4c-hY:APA91bFQABhJCjVj9j6s2d2pKxytYjcVw8ih6-mtGiR5JORkxvShdlhAPdLEuO7A5w6YCXkIzb4S-Jx9-7CnoSJFgaTH62XuQtdcrG5NFBedl7E3SsH_YwEEv6XYiCbME7lms1QGnftp"
);

export const sendNotification = (token, title, body) => {
  // console.log(firebase.serverKey);
  const message = {
    to: token,
    notification: {
      title: title,
      body: body,
    },
  };
  fcm.send(message, function (err, response) {
    if (err) {
      console.log("Something has gone wrong!", err);
    } else {
      console.log("Successfully sent with response: ", response);
    }
  });
};
export const sendNotificationWithPayload = async ({ token, body, data,title }) => {
  // console.log()
  const message = {
    to: token,
    notification: {
      body: body,
      title:title
    },
    data,
    
  };
  console.log("this is messsage for notification", message);

  return fcm.send(message, function (err, response) {
    if (err) {
      console.log("Message for payload: ", message);
      console.log("Something has gone wrong!", err);
      return false;
    } else {
      console.log("Successfully sent with response: ", response);
      return true;
    }
  });
};
export const sendNotificationForMessage = ({ token, title, body, data }) => {
  const message = {
    to: token,
    notification: {
      title: title,
      body: body,
    },
    data,
  };
  fcm.send(message, function (err, response) {
    if (err) {
      console.log("Something has gone wrong!", err);
    } else {
      console.log("Successfully sent with response: ", response);
    }
  });
};
