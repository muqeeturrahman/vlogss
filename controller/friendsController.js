import usersModel from "../models/users.js";
import friendModel from "../models/friends.js";
import NotificationModel from "../models/notificationModel.js";
import { sendNotificationWithPayload } from "../helpers/notification.js";
import { success, errors, validation } from "../helpers/responseApi.js";
import { findNotificationCount } from "../models/notificationModel.js";
import { notificationCountIO } from "../socketEventListener.js";
import mongoose from "mongoose";
// import {
//   addFriendValidator,
//   blockUnBlockFriendValidator,
//   unfriendValidator,
// } from "../validators/validator.js";
export const addFriends = async (req, res, next) => {
  try {
    // await addFriendValidator.validateAsync(req.body);
    const friendId = req.body.friendId;
    const AlreadyRequest = await friendModel.find({
      $or: [
        { userId: req.user._id, friendId: friendId },
        { userId: friendId, friendId: req.user._id },
      ],
      isRequest: true,

    });

    if (AlreadyRequest.length > 0) {
      return res
        .status(400)
        .json(validation("Friend request already sent/received"));
    }
    // update friend data object
    const friendData = {
      userId: req.user._id,
      friendId: friendId,
      isAccepted: false,
      isUnFriend: false,
      isRequest: true,
    };

    await friendModel.updateOne(
      { userId: req.user._id, friendId: friendId },
      { $set: friendData },
      { upsert: true }
    );
    const user = await usersModel
      .findById(req.user._id)
      .select("username avatar");


    const payload = {
      type: "friendRequest",
      userName: user.username,
      avatar: user.avatar,
      userId: user._id,
    };
    const title = "Friend Request";
    const body = `${user.username} sent you a friend Request`;

    const friend = await usersModel.findById(friendId).populate("devices");
    console.log("friendId>>>", friend);

    if (friend?.devices?.length > 0 && friend?.isNotification && !friend?.isDeleted) {
      const notifications = friend.devices.map(async (devices) => {
        console.log("these are the devices", devices);
        // const count = await findNotificationCount(friend._id)
        // console.log("harvey>>>>", count);
        // notificationCountIO(count, friend._id)

        await sendNotificationWithPayload({
          token: devices.deviceToken,
          body: body,
          data: payload,
          title: title,
        });
        // }
      });

      await Promise.all(notifications);
    }



    await NotificationModel.create({
      userId: friendId,
      body: body,
      payload: payload,
    });

    const count = await findNotificationCount(friend._id)
    console.log("harvey>>>>", count);
    notificationCountIO(count, friend._id)
    return res
      .status(200)
      .json(success("Friend request sent successfully", [], 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const getFriends = async (req, res, next) => {
  try {
    const { currentPage = 1, status, itemsPerPage = 10, username } = req.query;

    // fetching blocked or unblocked friends
    const filteredFriendsList = await friendModel
      .find({
        $or: [{ friendId: req.user._id }, { userId: req.user._id }],
        isBlocked: 0,
        isAccepted: 1,
        isUnFriend: 0,
        status: 1,
      })
      .populate({
        path: "userId",
        match: {
          _id: { $ne: req.user._id },          // Exclude current user from populating userId
          isDeleted: false,
        },
        select: "username avatar fullName _id userId",
      })
      .populate({
        path: "friendId",
        match: {
          _id: { $ne: req.user._id }, // Exclude current user from populating friendId

        },
        select: "username avatar fullName _id friendId ",
      })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);
    const friendsList = filteredFriendsList.filter(e => e.userId !== null || e.friendId !== null);

    return res
      .status(200)
      .json(success("Get friends successfully", friendsList, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const blockUnBlockFriend = async (req, res, next) => {
  try {
    // await blockUnBlockFriendValidator.validateAsync(req.body);
    let { status, friendId, isBlocked } = req.body;
    console.log(req.body);
    // isBlocked = Number(isBlocked);
    // isBlocked = Boolean(isBlocked)

    console.log(req.user._id);
    let Block_id;


    if (isBlocked === 0 || isBlocked != true) {
      Block_id = null;
    } else {
      Block_id = req.user._id;
    }


    // update friend block or unblock
    let friend = await friendModel.findOneAndUpdate(
      {
        $or: [
          {
            userId: new mongoose.Types.ObjectId(friendId),
            friendId: new mongoose.Types.ObjectId(req.user._id),
          },
          {
            userId: new mongoose.Types.ObjectId(req.user._id),
            friendId: new mongoose.Types.ObjectId(friendId),
          },
        ],
      },
      {
        isBlocked,
        isRequest: false,
        Block_id,
        isAccepted: false
      },
      {
        new: true,
      }
    );
    if (!friend) {
      console.log("inside>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

      friend = await friendModel.create({
        userId: new mongoose.Types.ObjectId(req.user._id),
        friendId: new mongoose.Types.ObjectId(friendId),
        isBlocked,
        isRequest: false,
        Block_id,
        isAccepted: false
      })
    }

    if (isBlocked) {
      const update = await friendModel.findOneAndUpdate(
        { _id: friend?._id },
        { isAccepted: false }
      );
    }
    return res
      .status(200)
      .json(
        success(
          `${Number(isBlocked) ? "Blocked friend" : "Unblocked user"
          } successfully`,
          friend,
          200
        )
      );
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const acceptRemoveFriend = async (req, res, next) => {
  try {
    const { isAccepted, friendId } = req.body;
    console.log("req,", req.username);
    console.log("accept", isAccepted);
    // update friend block or unblock
    await friendModel.updateOne(
      {
        userId: new mongoose.Types.ObjectId(friendId),
        friendId: new mongoose.Types.ObjectId(req.user._id),
      },
      {
        $set: { isAccepted, isUnFriend: 0, isRequest: 0 },
      }
    )
    const user = await usersModel
      .findById(req.user._id)
      .select("username avatar");
    console.log("user>>", user);
    const payload = {
      type: "acceptRequest",
      userName: user.username,
      avatar: user.avatar,
      userId: user._id,
    };
    const title = "Friend Request";
    const body = `${user.username} accepted your friend Request`;
    const friend = await usersModel.findById(friendId).populate("devices")
    console.log("friend", friend);
    if (isAccepted == 1) {

      if (friend?.devices?.length > 0 && friend?.isNotification && !friend?.isDeleted) {
        console.log("inside the function>>");
        const notifications = friend?.devices?.map(async (devices) => {
          console.log("these are the devices", devices);
          // const count = await findNotificationCount(friend._id)
          // console.log("harvey>>>>", count);
          // notificationCountIO(count, friend._id)
          // if (friend.isNotification) {
          await sendNotificationWithPayload({
            token: devices?.deviceToken,
            body: body,
            data: payload,
            title: title,
          });
          // }
        });

        await Promise.all(notifications);
      }

      await NotificationModel.create({
        userId: friendId,
        body: body,
        payload: payload,
      });
      const count = await findNotificationCount(friend._id)
      console.log("harvey>>>>", count);
      notificationCountIO(count, friend._id)
    }

    return res
      .status(200)
      .json(
        success(
          `your request ${Number(isAccepted) ? "has been accepted" : "has been removed"
          } `,
          [],
          200
        )
      );
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};
export const delteRequest = async (req, res, next) => {
  try {
    const { friendId } = req.body;
    await friendModel.deleteOne(
      {
        userId: new mongoose.Types.ObjectId(req.user._id),
        friendId: new mongoose.Types.ObjectId(friendId),
      },
    )
    return res.status(200).json(success(`Request deleted successfully`, [], 200));

  }
  catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
}
export const unFriend = async (req, res, next) => {
  try {
    // await unfriendValidator.validateAsync(req.body);
    const { friendId } = req.body;

    // update unfriend users
    // .find({
    //   $or: [
    //     { userId: new mongoose.Types.ObjectId(friendId), friendId: new mongoose.Types.ObjectId(req.user._id) },
    //     { userId: new mongoose.Types.ObjectId(req.user._id), friendId: new mongoose.Types.ObjectId(friendId) },
    //   ],
    // });
    const unfriend = await friendModel.deleteOne(
      {
        $or: [
          {
            userId: new mongoose.Types.ObjectId(friendId),
            friendId: new mongoose.Types.ObjectId(req.user._id),
          },
          {
            userId: new mongoose.Types.ObjectId(req.user._id),
            friendId: new mongoose.Types.ObjectId(friendId),
          },
        ],
      }
      // {
      //   $set: { isUnFriend: 1, isRequest: false, isAccepted: false },
      // }
    );

    if (unfriend) {
      return res.status(200).json(success(`Unfriend successfully`, [], 200));
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const friendRequestList = async (req, res, next) => {
  try {
    // const {
    //   currentPage = 1,
    //   itemsPerPage = 10,
    //   username,
    //   // friendId,
    // } = req.query;

    // fetching blocked or unblocked friends
    const filteredFriendsList = await friendModel
      .find({
        friendId: req.user._id,
        isBlocked: false,
        isAccepted: false,
        isUnFriend: false,
        isRequest: true,
        status: 1,
      })
      .populate({
        path: "userId",
        match: {
          //   username: { $regex: new RegExp(username, "i") },
          isDeleted: false,
        },
        select: "username avatar fullName _id",
      });
    // .skip((currentPage - 1) * itemsPerPage)
    // .limit(itemsPerPage);

    const friendsList = filteredFriendsList.filter(friend => friend.userId !== null);
    return res
      .status(200)
      .json(success("Friend Request List successfully", friendsList, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const getBlockFriend = async (req, res, next) => {
  console.log("hiiiii");
  console.log("userId...", req.user._id);
  const { currentPage = 1, itemsPerPage = 10 } = req.query;

  const blockedFriend = await friendModel
    .find({
      $or: [{ friendId: req.user._id }, { userId: req.user._id }],
      Block_id: req.user._id,
      isBlocked: true,
    })
    .populate({
      path: "userId",
      match: { _id: { $ne: req.user._id } },
      select: "username avatar fullName _id friendId ",
    })
    .populate({
      path: "friendId",
      match: { _id: { $ne: req.user._id } },
      select: "username avatar fullName _id friendId ",
    })
    .skip((currentPage - 1) * itemsPerPage)
    .limit(itemsPerPage);
  console.log("blocked", blockedFriend);

  return res
    .status(200)
    .json(success("Get blocked successfully", blockedFriend, 200));
};
