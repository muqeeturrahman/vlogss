import twilio from "twilio"
import SmSConfig from "../config/smsConfig"

const Client=twilio(SmSConfig.Account_sid,SmSConfig.Auth_Token);

export const sendSms=async(to,smsBody,next)=>{
   try {
    await Client.messages
      .create({
        body: smsBody,
        from: "+18645286912",   //this is not the right number
        to: to,
        
      })
      .then((message) => {
        console.log(message);
        next;
      });
  } catch (error) {
    console.log(error);
  }
}
////////////////
export const sendResetPasswordPhone=(randomCode, phoneNumber)=> {
    // const accountSid = "AC667e7891528b4f175d6b8711788645274b";
    // const authToken = process.env.AUTH_TOKEN;
    const client = twilio(SmSConfig.Account_sid, SmSConfig.Auth_Token);
    console.log(phoneNumber);
    client.messages
        .create({
            body: "verification code is" + `${randomCode}`,
            from: "+12705175386",
            to: `${phoneNumber}`
        })
        .then(message => console.log(message.sid));
}