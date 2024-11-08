import { Router } from "express";
import { viewPrivacyPolicy } from "../controller/privacyPolicyController.js"
import usersMiddleware from "../middleware/usersMiddleware.js";
export let privacyPolicyRouter=Router()
privacyPolicyRouter
  .route("/viewPrivacyPolicy")
  .get([usersMiddleware, viewPrivacyPolicy]);
// const router = express.Router();
// const usersMiddleware = require("../middleware/usersMiddleware");
// const privacyPolicyController = require("../controller/privacyPolicyController");

// router.get(
//   "/viewPrivacyPolicy",
//   usersMiddleware,
//   privacyPolicyController.viewPrivacyPolicy,
// );

// module.exports = router;
 