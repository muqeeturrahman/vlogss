import { Router } from "express";
import { addRating } from "../controller/rateController.js";
import usersMiddleware from "../middleware/usersMiddleware.js";
export let rateRouter = Router();
rateRouter.route("/addRating").post([usersMiddleware,addRating])
// const router = express.Router();
// const usersMiddleware = require("../middleware/usersMiddleware");
// // const {
// //   addRatingValidators,
// //   validationFunction,
// // } = require("../validators/validators");
// const rateController = require("../controller/rateController");

// router.post(
//   "/addRating",
//   usersMiddleware,
//   // addRatingValidators,
//   // validationFunction,
//   rateController.addRating,
// );

// module.exports = router;
