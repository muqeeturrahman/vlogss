import { Router } from "express";
import {
  addFriends,
  getFriends,
  blockUnBlockFriend,
  acceptRemoveFriend,
  unFriend,
  friendRequestList,
  getBlockFriend,
  delteRequest
} from "../controller/friendsController.js";
import usersMiddleware from "../middleware/usersMiddleware.js";
export let friendsRouter=Router();
friendsRouter.route("/addFriends").post([usersMiddleware,addFriends]);
friendsRouter.route("/deleteRequest").post([usersMiddleware,delteRequest]);
friendsRouter.route("/getFriends").get([usersMiddleware,getFriends]);
friendsRouter.route("/blockUnBlockFriend").put([usersMiddleware,blockUnBlockFriend]);
friendsRouter.route("/acceptRemoveFriend").put([usersMiddleware,acceptRemoveFriend]);
friendsRouter.route("/unFriend").put([usersMiddleware,unFriend]);
friendsRouter.route("/friendRequestList").get([usersMiddleware,friendRequestList]);
friendsRouter.route("/getBlocked").get([usersMiddleware, getBlockFriend]);

// const router = express.Router();
// const usersMiddleware = require("../middleware/usersMiddleware");
// const {
//   addFriendValidators,
//   getFriendsValidators,
//   blockUnBlockFriendValidators,
//   acceptRemoveFriendValidators,
//   unFriendValidators,
//   validationFunction,
// } = require("../validators/validators");
// const friendsController = require("../controller/friendsController");

// router.post(
//   "/addFriends",
//   usersMiddleware,
//   addFriendValidators,
//   validationFunction,
//   friendsController.addFriends
// );

// router.get(
//   "/getFriends",
//   usersMiddleware,
//   getFriendsValidators,
//   validationFunction,
//   friendsController.getFriends
// );

// router.put(
//   "/blockUnBlockFriend",
//   usersMiddleware,
//   blockUnBlockFriendValidators,
//   validationFunction,
//   friendsController.blockUnBlockFriend
// );

// router.put(
//   "/acceptRemoveFriend",
//   usersMiddleware,
//   // acceptRemoveFriendValidators,
//   // validationFunction,
//   friendsController.acceptRemoveFriend
// );

// router.put(
//   "/unFriend",
//   usersMiddleware,
//   unFriendValidators,
//   validationFunction,
//   friendsController.unFriend
// );

// router.get(
//   "/friendRequestList",
//   usersMiddleware,
//   friendsController.friendRequestList
// );

// module.exports = router;
