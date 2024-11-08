import helpModel from "../models/help.js";
import { success, errors, validation } from "../helpers/responseApi.js";

export const addHelp = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    // help data object
    const helpData = {
      name: name,
      email: email,
      message: message,
      userId: req.user._id,
    };

    // user image url
    if (req.file) {
      req.body.avatar = `uploads/userProfile/${req.file.filename}`;
      userObj["avatar"] = req.body.avatar;
    }
    // create new help
    const addHelp = await new helpModel(helpData).save();
    return res
      .status(200)
      .json(
        success("Help & Support form has been submitted successfully", [], 200)
      );
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};
