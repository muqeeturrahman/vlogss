import { config } from "dotenv";
config();

const SmSConfig={
    Account_sid:process.env.ACCOUNT_SID,
    Auth_Token:process.env.AUTH_TOKEN,
};

export default SmSConfig