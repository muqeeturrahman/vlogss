import usersModel from "../models/users.js";
import { success, errors, validation } from "../helpers/responseApi.js";
import ratingModel from "../models/rating.js";
// exports.addRating = async (req, res, next) => {
//   try {
//     const { pageSize = 0, phoneNumber, pageNumber = 10 } = req.body;
//     const skipCount = (pageNumber - 1) * pageSize;

//     // get all phone number invites
//     const getAllInvite = await usersModel
//       .find(
//         {
//           phoneNumber: { $in: phoneNumber },
//           status: 1,
//           isAdmin: { $ne: 1 },
//         },
//         "username avatar",
//       )
//       .skip(skipCount)
//       .limit(pageSize);

//     return res
//       .status(200)
//       .json(success("Get All Invite User successfully", getAllInvite, 200));
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).json(errors(error.message, 500));
//   }
// };

export const addRating = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const rateUs = await ratingModel.create({
      userId: req.user._id,
      rating,
      review,
    });
    return res
      .status(200)
      .json(success("Rating has submitted successfully", rateUs, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};
