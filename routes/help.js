import { Router } from "express";
import { addHelp } from "../controller/helpController.js";
import usersMiddleware from "../middleware/usersMiddleware.js";
import { handleMultipartData } from "../validators/multipartData.js";
export let helpRouter=Router();
helpRouter.route("/addHelp").post([usersMiddleware,handleMultipartData.single("image"),addHelp]);
// const multer = require("multer");
// const usersMiddleware = require("../middleware/usersMiddleware");
// const {
//   addHelpValidators,
//   validationFunction,
// } = require("../validators/validators");
// const helpController = require("../controller/helpController");
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./uploads/userProfile");
//   },
//   filename: function (req, file, cb) {
//     let string = `${file.originalname}`;
//     string = string.replace(/ /g, "_");
//     cb(null, moment().format("YYYY-MM-DD") + "_" + string);
//   },
// });
// const upload = multer({ storage: storage });
// router.post(
//   "/addHelp",
//   upload.single("image"),
//   usersMiddleware,
//   addHelpValidators,
//   validationFunction,
//   helpController.addHelp
// );

// module.exports = router;
