import privacyPolicyModel from "../models/privacyPolicy.js";
import { success, errors, validation } from "../helpers/responseApi.js";

export const viewPrivacyPolicy = async (req, res, next) => {
  try {
    console.log("api is hitting>>");

    // get all privacy policy
    const viewPrivacyPolicy = await privacyPolicyModel.find({});
    console.log("viewPrivacyPolicy", viewPrivacyPolicy);

    return res
      .status(200)
      .json(
        success("View Privacy Policy successfully", viewPrivacyPolicy, 200)
      );
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};
