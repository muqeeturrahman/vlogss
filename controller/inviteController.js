import usersModel from "../models/users.js";
import friendModel from "../models/friends.js";
import { success, errors, validation } from "../helpers/responseApi.js";

export const viewInvite = async (req, res, next) => {
  try {

    const { phoneNumber } = req.body;
    const updatedPhoneNumbers = phoneNumber.map(number => {
      // Check if the number already starts with '+'
      if (number.startsWith('+')) {
        return number;
      } else {
        // Prepend '+' if not present
        return `+${number}`;
      }
    });
    console.log("up>>", updatedPhoneNumbers);

    // Update req.body with the modified phone numbers
    req.body.phoneNumber = updatedPhoneNumbers;

    let friends = await friendModel.find({ userId: req.user._id }).populate("friendId")
    let numbers = []
    friends.map((e) => {
      numbers.push(e.friendId.phoneNumber)
    })
    let inviteStatusList = [];

    for (let i = 0; i < updatedPhoneNumbers.length; i++) {

      if (!numbers.includes(updatedPhoneNumbers[i])) {
        console.log(updatedPhoneNumbers[i], "phoneNumber[i]");

        // Find user by phone number
        let user = await usersModel
          .findOne({ phoneNumber: updatedPhoneNumbers[i] })
          .select("phoneNumber username fullName avatar ");

        let status = false;

        if (user) {
          status = true;
        }

        // Push either the user object or an object with the phone number
        inviteStatusList.push({ user: user || { phoneNumber: updatedPhoneNumbers[i] }, status: status });
      }
    }
    return res
      .status(200)
      .json(success("Invite status list", inviteStatusList, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

