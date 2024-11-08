import { Router } from "express";
import { viewInvite } from "../controller/inviteController.js"
import usersMiddleware from "../middleware/usersMiddleware.js";
export let inviteRouter=Router();
inviteRouter.route("/viewInvite").get([usersMiddleware, viewInvite]);
// const router = express.Router();
// const usersMiddleware = require("../middleware/usersMiddleware");
// const {
//   viewInviteValidator,
//   validationFunction,
// } = require("../validators/validators");
// const inviteController = require("../controller/inviteController");

// router.get(
//   "/viewInvite",
//   usersMiddleware,
//   // viewInviteValidator,
//   // validationFunction,
//   inviteController.viewInvite,
// );

// module.exports = router;
