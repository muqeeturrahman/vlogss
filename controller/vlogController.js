import vlogModel from "../models/vlogModel.js";
import usersModel from "../models/users.js";
import { success, errors, validation } from "../helpers/responseApi.js";
import { checkMongooseId } from "../helpers/common.js";
import vlogLikesModel from "../models/vlogLikesModel.js";
import NotificationModel from "../models/notificationModel.js";
import friendModel from "../models/friends.js";
import vlogCommentModel from "../models/vlogCommentsModel.js";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import reportUserModel from "../models/reportUser.js";
import { findNotificationCount } from "../models/notificationModel.js";
import { notificationCountIO } from "../socketEventListener.js";
// import { videoThumbnail ,deleteObject} from "../validators/generateThumbnail.js";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import {
  uploadFileToS3,
  deleteObjectFromS3,
} from "../validators/generateThumbnail.js";
import archiver from "archiver";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

console.log(process.env.LOCALDB);
import {
  sendNotification,
  sendNotificationWithPayload,
} from "../helpers/notification.js";
// import { addVideoValidator,editVideoValidator } from "../validators/validator.js";
import mongoose from "mongoose";
import duration from "moment";
import { count, log } from "console";

export const addVideo = async (req, res, next) => {
  try {
    console.log("files=====", req.files);

    const { taggedPeople, description } = req.body;
    // const link = `uploads/userProfile/${req.files.video[0].filename}`;
    const link = process.env.S3_BUCKET_URL + req.baseName;
    const image = `uploads/userProfile/${req.files.image[0].filename}`;
    console.log("req.thumbnailName", req.thumbnailName);

    const video = await vlogModel.create({
      mediaUrl: link,
      imageUrl: image,
      userId: req.user._id,
      taggedPeople,
      description,
      thumbnailPath:
        req.files.video[0].mimetype.split("/")[0] === "video"
          ? process.env.S3_BUCKET_URL + req.thumbnailName
          : "",
    });
    console.log("api is hitiing 2");

    return res
      .status(200)
      .json(success("Video uploaded successfully", video, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const blockedUsers = await friendModel.find({
      $or: [
        { userId, isBlocked: true },
        { friendId: userId, isBlocked: true },
      ],
    });
    console.log("Blocked Users:", blockedUsers);

    // console.log("Filtered Block IDs:", filteredblockIds);
    const filteredblockIds = blockedUsers.reduce((ids, user) => {
      if (
        user.userId.toString() !== userId.toString() &&
        !ids.includes(user.userId.toString())
      ) {
        ids.push(user.userId.toString());
      }
      if (
        user.friendId.toString() !== userId.toString() &&
        !ids.includes(user.friendId.toString())
      ) {
        ids.push(user.friendId.toString());
      }
      return ids;
    }, []);
    const myProfile = await usersModel.aggregate([
      // Aggregation stages to fetch profile details
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $lookup: {
          from: "vlogs",
          localField: "_id",
          foreignField: "userId",
          as: "videos",
        },
      },
      {
        $lookup: {
          from: "vlogs",
          localField: "_id",
          foreignField: "taggedPeople",
          as: "taggedVideos",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "taggedVideos.userId",
          foreignField: "_id",
          as: "taggedUsers",
        },
      },
      // Place the $match stage here
      // {
      //   $match: {
      //     "taggedVideos.userId": { $nin: filteredblockIds.map(id => new mongoose.Types.ObjectId(id)) }
      //   }
      // },
      // {
      //   $unwind: "$taggedVideos",
      // },
      {
        $lookup: {
          from: "vloglikes",
          localField: "_id",
          foreignField: "userId",
          as: "likedVlogs",
        },
      },
      {
        $lookup: {
          from: "vloglikes",
          localField: "videos._id",
          foreignField: "vlogId",
          as: "Likes",
        },
      },
      {
        $lookup: {
          from: "vloglikes",
          localField: "taggedVideos._id",
          foreignField: "vlogId",
          as: "vlogLikes",
        },
      },
      {
        $lookup: {
          from: "vlogcomments",
          localField: "videos._id",
          foreignField: "vlogId",
          as: "Comments",
        },
      },
      {
        $addFields: {
          videos: {
            $map: {
              input: "$videos",
              as: "video",
              in: {
                $mergeObjects: [
                  "$$video",
                  {
                    isLiked: { $in: ["$$video._id", "$likedVlogs.vlogId"] },
                    likeCount: {
                      $size: {
                        $filter: {
                          input: "$Likes",
                          as: "like",
                          cond: { $eq: ["$$video._id", "$$like.vlogId"] },
                        },
                      },
                    },
                    commentsCount: {
                      $size: {
                        $filter: {
                          input: "$Comments",
                          as: "comments",
                          cond: { $eq: ["$$video._id", "$$comments.vlogId"] },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          taggedVideos: {
            $map: {
              input: "$taggedVideos",
              as: "taggedVideo",
              in: {
                $mergeObjects: [
                  "$$taggedVideo",
                  {
                    isLiked: {
                      $in: ["$$taggedVideo._id", "$likedVlogs.vlogId"],
                    },
                    likeCount: {
                      $size: {
                        $filter: {
                          input: "$vlogLikes",
                          as: "like",
                          cond: { $eq: ["$$taggedVideo._id", "$$like.vlogId"] },
                        },
                      },
                    },
                    commentsCount: {
                      $size: {
                        $filter: {
                          input: "$Comments",
                          as: "comments",
                          cond: {
                            $eq: ["$$taggedVideo._id", "$$comments.vlogId"],
                          },
                        },
                      },
                    },
                    userId: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$taggedUsers",
                            as: "user",
                            cond: {
                              $eq: ["$$user._id", "$$taggedVideo.userId"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          username: 1,
          avatar: 1,
          videos: {
            _id: 1,
            title: 1,
            userId: 1,
            mediaType: 1,
            mediaUrl: 1,
            imageUrl: 1,
            taggedPeople: 1,
            description: 1,
            videoDuration: 1,
            createdAt: 1,
            updatedAt: 1,
            isLiked: 1,
            likeCount: 1,
            commentsCount: 1,
          },
          // taggedVideos: {
          //   _id: 1,
          //   title: 1,
          //   description: 1,
          //   mediaType: 1,
          //   mediaUrl: 1,
          //   imageUrl: 1,
          //   userId: {
          //     _id: 1,
          //     fullName: 1,
          //     username: 1,
          //     avatar: 1,
          //   },
          //   likeCount: 1,
          //   isLiked: 1,
          //   commentsCount: 1,
          // },
          taggedVideos: {
            $filter: {
              input: "$taggedVideos",
              as: "taggedVideo",
              cond: {
                $not: {
                  $in: [
                    "$$taggedVideo.userId._id",
                    filteredblockIds.map(
                      (id) => new mongoose.Types.ObjectId(id)
                    ),
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json(success("My Profile", myProfile, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};
// export const getMyProfile = async (req, res, next) => {
//   try {
//     const userId = req.user._id;
//     const blockedUsers = await friendModel.find({
//       $or: [
//         { userId, isBlocked: true },
//         { friendId: userId, isBlocked: true },
//       ],
//     });
//     console.log("Blocked Users:", blockedUsers);

//     const filteredblockIds = blockedUsers.reduce((ids, user) => {
//       if (
//         user.userId.toString() !== userId.toString() &&
//         !ids.includes(user.userId.toString())
//       ) {
//         ids.push(user.userId.toString());
//       }
//       if (
//         user.friendId.toString() !== userId.toString() &&
//         !ids.includes(user.friendId.toString())
//       ) {
//         ids.push(user.friendId.toString());
//       }
//       return ids;
//     }, []);
//     console.log("Filtered Block IDs:", filteredblockIds);

//     const myProfile = await usersModel.aggregate([
//       // Aggregation stages to fetch profile details
//       {
//         $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
//       },
//       {
//         $lookup: {
//           from: "vlogs",
//           localField: "_id",
//           foreignField: "userId",
//           as: "videos",
//         },
//       },
//       {
//         $lookup: {
//           from: "vlogs",
//           localField: "_id",
//           foreignField: "taggedPeople",
//           as: "taggedVideos",
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "taggedVideos.userId",
//           foreignField: "_id",
//           as: "taggedUsers",
//         },
//       },
//       {
//         $lookup: {
//           from: "vloglikes",
//           localField: "_id",
//           foreignField: "userId",
//           as: "likedVlogs",
//         },
//       },
//       {
//         $lookup: {
//           from: "vloglikes",
//           localField: "videos._id",
//           foreignField: "vlogId",
//           as: "Likes",
//         },
//       },
//       {
//         $lookup: {
//           from: "vloglikes",
//           localField: "taggedVideos._id",
//           foreignField: "vlogId",
//           as: "vlogLikes",
//         },
//       },
//       {
//         $lookup: {
//           from: "vlogcomments",
//           localField: "videos._id",
//           foreignField: "vlogId",
//           as: "Comments",
//         },
//       },
//       {
//         $addFields: {
//           videos: {
//             $map: {
//               input: "$videos",
//               as: "video",
//               in: {
//                 $mergeObjects: [
//                   "$$video",
//                   {
//                     isLiked: { $in: ["$$video._id", "$likedVlogs.vlogId"] },
//                     likeCount: {
//                       $size: {
//                         $filter: {
//                           input: "$Likes",
//                           as: "like",
//                           cond: { $eq: ["$$video._id", "$$like.vlogId"] },
//                         },
//                       },
//                     },
//                     commentsCount: {
//                       $size: {
//                         $filter: {
//                           input: "$Comments",
//                           as: "comments",
//                           cond: { $eq: ["$$video._id", "$$comments.vlogId"] },
//                         },
//                       },
//                     },
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           taggedVideos: {
//             $map: {
//               input: "$taggedVideos",
//               as: "taggedVideo",
//               in: {
//                 $mergeObjects: [
//                   "$$taggedVideo",
//                   {
//                     isLiked: {
//                       $in: ["$$taggedVideo._id", "$likedVlogs.vlogId"],
//                     },
//                     likeCount: {
//                       $size: {
//                         $filter: {
//                           input: "$vlogLikes",
//                           as: "like",
//                           cond: { $eq: ["$$taggedVideo._id", "$$like.vlogId"] },
//                         },
//                       },
//                     },
//                     commentsCount: {
//                       $size: {
//                         $filter: {
//                           input: "$Comments",
//                           as: "comments",
//                           cond: {
//                             $eq: ["$$taggedVideo._id", "$$comments.vlogId"],
//                           },
//                         },
//                       },
//                     },
//                     userId: {
//                       $arrayElemAt: [
//                         {
//                           $filter: {
//                             input: "$taggedUsers",
//                             as: "user",
//                             cond: {
//                               $eq: ["$$user._id", "$$taggedVideo.userId"],
//                             },
//                           },
//                         },
//                         0,
//                       ],
//                     },
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           fullName: 1,
//           username: 1,
//           avatar: 1,
//           videos: {
//             _id: 1,
//             title: 1,
//             userId: 1,
//             mediaType: 1,
//             mediaUrl: 1,
//             imageUrl: 1,
//             taggedPeople: 1,
//             description: 1,
//             videoDuration: 1,
//             createdAt: 1,
//             updatedAt: 1,
//             isLiked: 1,
//             likeCount: 1,
//             commentsCount: 1,
//           },
//           taggedVideos: {
//             $filter: {
//               input: "$taggedVideos",
//               as: "taggedVideo",
//               cond: {
//                 $not: {
//                   $in: ["$$taggedVideo.userId._id", filteredblockIds.map(id => new mongoose.Types.ObjectId(id))]
//                 }
//               }
//             }
//           },
//         },
//       },
//     ]);

//     return res.status(200).json(success("My Profile", myProfile, 200));
//   } catch (error) {
//     res.status(500).json(errors(error.message, 500));
//   }
// };

export const myProfile2 = async (req, res, next) => {
  try {
    const myProfile = await usersModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $lookup: {
          from: "vlogs",
          localField: "_id",
          foreignField: "userId",
          as: "videos",
        },
      },
      {
        $lookup: {
          from: "vlogs",
          localField: "_id",
          foreignField: "taggedPeople",
          as: "taggedVideos",
        },
      },

      // {
      //   $lookup: {
      //     from: "vlogs",
      //     localField: "_id",
      //     foreignField: "taggedPeople",
      //     as: "taggedVideos",
      //   },
      // },
      {
        $lookup: {
          from: "vloglikes",
          localField: "_id",
          foreignField: "userId",
          as: "likedVlogs",
        },
      },
      // {
      //   $unwind: "$likedVlogs",
      // },
      // {
      //   $match: {
      //     "likedVlogs.userId": new mongoose.Types.ObjectId(req.user._id),
      //   },
      // },
      {
        $addFields: { "likedVlogs.isLiked": true },
      },
      {
        $addFields: {
          videos: {
            $map: {
              input: "$videos",
              as: "video",
              in: {
                $mergeObjects: [
                  "$$video",
                  {
                    isLiked: {
                      $cond: [
                        { $in: ["$$video._id", "$likedVlogs.vlogId"] },
                        true,
                        false,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },

      {
        $project: {
          _id: 1,
          fullName: 1,
          username: 1,
          avatar: 1,

          videos: {
            _id: 1,
            title: 1,
            userId: 1,
            mediaType: 1,
            mediaUrl: 1,
            imageUrl: 1,
            taggedPeople: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          taggedVideos: {
            _id: 1,
            userId: 1,
            mediaType: 1,
            mediaUrl: 1,
            imageUrl: 1,
            taggedPeople: 1,
          },
          likedVlogs: 1,
          videos: 1,
        },
      },
    ]);
    return res.status(200).json(success("My Profile", myProfile, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};
export const homeScreen = async (req, res, next) => {
  try {
    const userId = req.user._id;
    console.log("User ID:", userId);
    const currentPage = parseInt(req.query.currentPage) || 1;
    console.log("Current Page:", currentPage);
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    console.log("Items Per Page:", itemsPerPage);
    const skipCount = (currentPage - 1) * itemsPerPage;

    const userFriends = await friendModel.find({
      $or: [
        { userId, isAccepted: true },
        { friendId: userId, isAccepted: true },
      ],
    });
    console.log("User Friends:", userFriends);

    const filteredfriendIds = userFriends.reduce((ids, user) => {
      if (
        user.userId.toString() !== userId.toString() &&
        !ids.includes(user.userId.toString())
      ) {
        ids.push(user.userId.toString());
      }
      if (
        user.friendId.toString() !== userId.toString() &&
        !ids.includes(user.friendId.toString())
      ) {
        ids.push(user.friendId.toString());
      }
      return ids;
    }, []);
    console.log("Filtered Friend IDs:", filteredfriendIds);

    const blockedUsers = await friendModel.find({
      $or: [
        { userId, isBlocked: true },
        { friendId: userId, isBlocked: true },
      ],
    });
    console.log("Blocked Users:", blockedUsers);

    const filteredblockIds = blockedUsers.reduce((ids, user) => {
      if (
        user.userId.toString() !== userId.toString() &&
        !ids.includes(user.userId.toString())
      ) {
        ids.push(user.userId.toString());
      }
      if (
        user.friendId.toString() !== userId.toString() &&
        !ids.includes(user.friendId.toString())
      ) {
        ids.push(user.friendId.toString());
      }
      return ids;
    }, []);
    console.log("Filtered Block IDs:", filteredblockIds);

    const reportPost = await reportUserModel.find({
      reportedById: userId,
    });
    console.log("Report Post:", reportPost);

    const reportedUserId = reportPost.map((report) => report.reportedToId);
    console.log("Reported User IDs:", reportedUserId);

    const videos1 = await vlogModel
      .find({
        $and: [
          { userId: { $in: [...filteredfriendIds, userId] } }, // Include user's own videos
          { userId: { $nin: filteredblockIds } },
          { userId: { $nin: reportedUserId } },
        ],
      })
      .populate("userId", "_id avatar fullName username isDeleted")
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(itemsPerPage)
      .select(
        "_id userId title mediaType mediaUrl imageUrl description videoDuration createdAt updatedAt"
      )
      .lean();
    console.log("Videos:", videos1);
    const videos = videos1.filter((video) => video.userId.isDeleted == false);

    // Calculate like count, comments count, and isLiked status
    for (const video of videos) {
      video.likeCount = await vlogLikesModel.countDocuments({
        vlogId: video._id,
      });
      console.log(`Like Count for video ${video._id}:`, video.likeCount);
      video.commentsCount = await vlogCommentModel.countDocuments({
        vlogId: video._id,
      });
      console.log(
        `Comments Count for video ${video._id}:`,
        video.commentsCount
      );
      video.isLiked = (await vlogLikesModel.exists({
        vlogId: video._id,
        userId,
      }))
        ? true
        : false;
      console.log(`Is Liked for video ${video._id}:`, video.isLiked);
    }

    return res.status(200).json({
      message: "Videos fetched successfully",
      data: videos,
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

// export const homeScreen = async (req, res, next) => {
//   try {
//     // Extract currentPage and itemsPerPage from req.query with default values
//     // const currentPage = parseInt(req.query.currentPage) || 1;
//     // const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;

//     // Calculate the number of items to skip based on currentPage and itemsPerPage
//     // const skipCount = (currentPage - 1) * itemsPerPage;

//     // Retrieve videos with pagination
//     // const videos1 = await vlogModel
//     //   .find({})
//     //   .populate({
//     //     path: "userId",
//     //     select: "fullName username",
//     //   })
//     //   .skip(skipCount)
//     //   .limit(itemsPerPage);
//     const videos = await vlogModel.aggregate([
//       {
//         $match: { userId: { $ne: new mongoose.Types.ObjectId(req.user._id) } },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "videos",
//         },
//       },

//       {
//         $lookup: {
//           from: "vloglikes",
//           localField: "_id",
//           foreignField: "userId",
//           as: "likedVlogs",
//         },
//       },
//       // {
//       //   $unwind: "$likedVlogs",
//       // },
//       // {
//       //   $match: {
//       //     "likedVlogs.userId": new mongoose.Types.ObjectId(req.user._id),
//       //   },
//       // },
//       {
//         $addFields: { "likedVlogs.isLiked": true },
//       },
//       {
//         $addFields: {
//           videos: {
//             $map: {
//               input: "$videos",
//               as: "video",
//               in: {
//                 $mergeObjects: [
//                   "$$video",
//                   {
//                     isLiked: {
//                       $cond: [
//                         { $in: ["$$video._id", "$likedVlogs.vlogId"] },
//                         true,
//                         false,
//                       ],
//                     },
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },

//       {
//         $project: {
//           _id: 1,
//           fullName: 1,
//           username: 1,
//           avatar: 1,

//           videos: {
//             _id: 1,
//             title: 1,
//             userId: 1,
//             mediaType: 1,
//             mediaUrl: 1,
//             imageUrl: 1,
//             taggedPeople: 1,
//             description: 1,
//             createdAt: 1,
//             updatedAt: 1,
//           },
//           likedVlogs: 1,
//           videos: 1,
//         },
//       },
//     ]);
//     return res.status(200).json(success("My Profile", videos, 200));
//   } catch (error) {
//     res.status(500).json(errors(error.message, 500));
//   }
// };

export const editVideo = async (req, res, next) => {
  try {
    // await editVideoValidator.validateAsync(req.body)
    const { _id, description, taggedPeople } = req.body;
    const editedVideo = await vlogModel.findByIdAndUpdate(
      _id,
      { description, taggedPeople },
      {
        new: true,
      }
    );
    console.log("editedVideo>>>>>>>>", editedVideo);

    return res
      .status(200)
      .json(success("Video edited Successfully", editedVideo, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Typo: It should be req.params.id, not req.paramas.id
    console.log(id);

    const deleteMedia = await vlogModel.findByIdAndDelete(id);
    if (!deleteMedia) {
      return res.status(400).json(validation("Error deleting post")); // Assuming validation is a function that formats validation error responses
    }

    return res
      .status(200)
      .json(success("Post deleted successfully", deleteMedia, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const videosByDates = async (req, res, next) => {
  const videos = await vlogModel
    .find({ userId: req.user._id })
    .sort({ createdAt: -1 });
  return res.status(200).json(success("Calendar", videos, 200));
};

export const likeVideo = async (req, res, next) => {
  try {
    const { vlogId } = req.body;
    if (!checkMongooseId(vlogId)) {
      return res.status(422).json(validation("vlog did not exists"));
    }
    const user = await usersModel
      .findById(req.user._id)
      .select("username avatar");
    // .populate({
    //   path: "devices",
    //   select: "deviceToken",
    // });
    const checkVlog = await vlogModel
      .findById({
        _id: req.body.vlogId,
      })
      .populate({
        path: "userId",
        populate: {
          path: "devices",
          select: "deviceToken",
        },
      });
    console.log("checkVlog", checkVlog);

    // checkVlog.userId.devices;
    if (!checkVlog) {
      return res.status(400).json(validation("video does not exist"));
    }
    const likeVideo = await vlogLikesModel.findOne({
      vlogId: req.body.vlogId,
      userId: req.user._id,
    });
    if (likeVideo) {
      let removeLike = await vlogLikesModel.findOneAndDelete({
        vlogId: req.body.vlogId,
        userId: req.user._id,
      });

      await NotificationModel.findOneAndDelete({
        userId: checkVlog.userId,
        "payload.id": vlogId,
        "payload.userId": req.user._id,
      });
      return res.status(200).json(success(removeLike));
    } else {
      var likedVideo = await vlogLikesModel.create({
        vlogId: req.body.vlogId,
        userId: req.user._id,
      });
      const payload = {
        type: "like",
        id: vlogId,
        userName: user.username,
        avatar: user.avatar,
        userId: user._id,
      };
      const title = "Like";
      const body = `${user.username} liked your video`;
      // console.log("this is a check vlog", checkVlog.userId.devices.length);
      console.log("user._id>>", user._id);
      console.log("checkVlog.userId._id>>>", checkVlog.userId._id);
      console.log(user._id != checkVlog.userId._id);

      if (user._id.equals(checkVlog.userId._id) == false) {
        if (
          checkVlog.userId.devices.length > 0 &&
          checkVlog.userId.isNotification
        ) {
          const notifications = checkVlog.userId.devices.map(
            async (devices) => {
              console.log("these are the devices", devices);
              const checkNotification = await usersModel.findById(req.user._id);
              console.log("this is notification check.....", checkNotification);
              if (
                checkNotification.isNotification &&
                !checkNotification.isDeleted
              ) {
                await sendNotificationWithPayload({
                  token: devices.deviceToken,
                  body: body,
                  data: payload,
                  title: title,
                });
              }
            }
          );

          await Promise.all(notifications);
        }
        await NotificationModel.create({
          userId: checkVlog.userId,
          body: body,
          payload: payload,
        });
      }
      console.log("harvey>>>>", checkVlog.userId);
      const count = await findNotificationCount(checkVlog.userId._id);
      console.log("harvey>>>>", count);

      notificationCountIO(count, checkVlog.userId._id);

      return res
        .status(200)
        .json(success("video liked successfully", likedVideo, 200));
    }
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const CommentVlog = async (req, res, next) => {
  try {
    const { vlogId, vlogComment } = req.body;
    if (!checkMongooseId(vlogId)) {
      return res.status(422).json(validation("vlog does not exist"));
    }
    const user = await usersModel
      .findById(req.user._id)
      .select("username avatar");

    const checkVlog = await vlogModel
      .findById({
        _id: vlogId,
      })
      .populate([
        {
          path: "userId",
          select: "devices isNotification isDeleted",
          populate: {
            path: "devices",
            select: "deviceToken",
          },
        },
      ]);
    console.log("vlog>>", checkVlog);

    if (!checkVlog) {
      return res.status(400).json(validation("vlog does not exist"));
    }
    console.log("check", !user._id.equals(checkVlog.userId._id));
    console.log("check2", checkVlog.userId.devices.length);
    console.log("check2", checkVlog.userId.isNotification);

    const commentVideo = await vlogCommentModel.create({
      vlogId: vlogId,
      userId: req.user._id,
      vlogComment: vlogComment,
    });

    const payload = {
      type: "comment",
      id: vlogId,
      userName: user.username,
      avatar: user.avatar,
      userId: req.user._id,
    };
    const title = "Comment";
    const body = `${user.username} commented on your post`;
    console.log("checking", user._id.equals(checkVlog.userId._id));
    if (user._id.equals(checkVlog.userId._id) == false) {
      if (
        checkVlog.userId.devices.length > 0 &&
        checkVlog.userId.isNotification &&
        !checkVlog.userId.isDeleted
      ) {
        console.log("hi>>>");

        const notifications = checkVlog.userId.devices.map(async (devices) => {
          await sendNotificationWithPayload({
            body: body,
            token: devices.deviceToken,
            data: payload,
            title: title,
          });
        });

        await Promise.all(notifications);
      }
      const data = await NotificationModel.create({
        userId: checkVlog.userId,
        body: body,
        payload: payload,
      });
      console.log("fdgfd");
      console.log("harvey>>>>", checkVlog.userId);
      //notification Count for Socket
      const count = await findNotificationCount(checkVlog.userId._id);
      console.log("harvey>>>>", count);
      notificationCountIO(count, checkVlog.userId._id);
    }

    return res
      .status(200)
      .json(success(commentVideo, "comment added successfully", 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const getUserFriendsById = async (req, res, next) => {
  try {
    const { currentPage = 1, status, itemsPerPage = 10, username } = req.query;

    // fetching blocked or unblocked friends
    const friendsList = await friendModel
      .find({
        $or: [{ friendId: req.body._id }, { userId: req.body._id }],
        isBlocked: 0,
        isAccepted: 1,
        isUnFriend: 0,
        status: 1,
      })
      .populate({
        path: "userId",
        match: {
          _id: { $ne: req.body._id }, // Exclude current user from populating userId
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

    return res
      .status(200)
      .json(success("Get friends successfully", friendsList, 200));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};
export const deleteFromBucket = async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json(validation("please provide key"));
    }
    const deleted = await deleteObjectFromS3(key);
    return res
      .status(200)
      .json(success(deleted, "object deleted successfully", 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};
export const combineMedia = async (req, res, next) => {
  try {
    let datat;
    let { inputAudioPath, inputImagePath, inputVideoPath, Image } = req.files;
    const { taggedPeople, description, title } = req.body;

    // Define output file path
    const outputFileName = `${Date.now()}-output.mp4`;
    const outputImageFileName = `${Date.now()}-output.png`;
    const outputFilePath = path.join(
      __dirname,
      "..",
      "uploads",
      "userProfile",
      outputFileName
    );
    let videoDuration;

    if (inputAudioPath && inputImagePath) {
      // console.log(inputAudioPath);
      // return inputAudioPath;
      datat = await new Promise((resolve, reject) => {
        combineaudioAndImage(
          (inputAudioPath = inputAudioPath[0].path),
          (inputImagePath = inputImagePath[0].path),
          outputFilePath,
          (videoUrl, duration) => {
            console.log("videourl>>", videoUrl);
            videoDuration = Math.round(duration);
            resolve(videoUrl); // resolve the Promise with videoUrl
          }
        );
      });
      console.log("duration>>", videoDuration);

      const image = Image[0].path;
      // console.log("datat.videoUrl>>", videoUrl);
      // console.log('datat.duration>>',datat.duration);

      const videoLink = await uploadFileToS3(datat, outputFileName);
      // console.log('this is video link',videoLink)
      const imageLink = await uploadFileToS3(image, outputImageFileName);

      // return videoUrl

      // res.json({ videoUrl });

      // .json(
      //   success("Combined audio and image successfully", outputFilePath, 200)
      // );

      // res.json({ videoLink, imageLink, image });
      // console.log("api is hitting till there", datat);

      // const Thumbnail = await videoThumbnail(datat);
      // console.log("Thumbnail", Thumbnail);

      // const video = await vlogModel.create({
      //   mediaUrl: videoLink,
      //   imageUrl: "imageLink",
      //   userId: req.user._id,
      //   taggedPeople,
      //   description,
      //   title,
      //   // thumbnailPath:
      //   //   req.files.video[0].mimetype.split("/")[0] === "video"
      //   //     ? process.env.S3_BUCKET_URL + req.thumbnailName
      //   //     : "",
      // });

      return res.status(200).json(
        success(
          "video added successfully",
          {
            imageLink,
            videoLink,
            title,
            taggedPeople,
            description,
            videoDuration,
          },
          200
        )
      );
    } else {
      // console.log("thubnail//////", req.thumbnailName);

      let output;
      let link;
      // const audioFilePath = inputAudioPath[0].path;
      // const videoFilePath = inputVideoPath[0].path;
      let videoDuration;
      datat = await new Promise((resolve, reject) => {
        combineVideoAndAudio(
          (inputAudioPath = inputAudioPath[0].path),
          (inputVideoPath = inputVideoPath[0].path),
          outputFilePath,
          async (videoUrl, duration) => {
            console.log("Combined audio and video successfully.");
            output = videoUrl;
            console.log("videourl>>", videoUrl);
            console.log("duration>>", duration);
            videoDuration = Math.round(duration);
            resolve(videoUrl);
          }
        );
      });
      console.log("api is hitting till there");
      console.log("datat.videoUrl>>", datat);
      console.log("datat.duration>>", videoDuration);
      const image = Image[0].path;
      const videoLink = await uploadFileToS3(datat, outputFileName);
      const imageLink = await uploadFileToS3(image, outputImageFileName);
      // const video = await vlogModel.create({
      //   mediaUrl: videoLink,
      //   imageUrl: imageLink,
      //   userId: req.user._id,
      //   taggedPeople,
      //   description,
      //   // thumbnailPath:
      //   // process.env.S3_BUCKET_URL + req.thumbnailName
      // });
      return res.status(200).json(
        success(
          "video added successfully",
          {
            videoLink,
            imageLink,
            title,
            taggedPeople,
            description,
            videoDuration,
          },
          200
        )
      );
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};
export const combineAudioAndVideo = async (req, res, next) => {
  try {
    if (!req.files || !req.files.inputAudioPath || !req.files.inputVideoPath) {
      return res.status(400).json({ message: "Input files not provided." });
    }

    const { inputAudioPath, inputVideoPath } = req.files;

    // Ensure that input files are array type
    if (!Array.isArray(inputAudioPath) || !Array.isArray(inputVideoPath)) {
      return res.status(400).json({ message: "Invalid input file format." });
    }

    // Extract file paths
    const audioFilePath = inputAudioPath[0].path;
    const videoFilePath = inputVideoPath[0].path;

    // Define output file path
    const outputFileName = `${Date.now()}-output.mp4`;
    const outputFilePath = path.join(
      __dirname,
      "..",
      "uploads",
      "userProfile",
      outputFileName
    );

    // Call the combineVideoAndAudio function

    await combineVideoAndAudio(
      audioFilePath,
      videoFilePath,
      outputFilePath,
      (videoUrl) => {
        console.log("Combined audio and video successfully.");
        res.json({ videoUrl });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

async function combineaudioAndImage(
  inputAudioPath,
  inputImagePath,
  outputFilePath,
  callback
) {
  const duration = await getDuration(inputAudioPath);
  console.log(duration);
  console.log("ssssssssssssssssssssssssssssss");
  console.log("audio duration:", duration);
  ffmpeg()
    .input(inputImagePath)
    .input(inputAudioPath)
    .inputOption("-stream_loop -1") // Loop the input video indefinitely
    .videoCodec("libx264") // Set video codec to libx264
    .audioCodec("aac") // Set audio codec to AAC
    .size("1920x1080")
    .videoBitrate("3000k")
    .outputOptions([
      "-pix_fmt yuv420p", // Set pixel format for compatibility
      `-vf setpts=${1 / 0.5}*PTS`, // Adjust playback speed
      "-preset slow", // Set encoding preset for slower encoding
      `-t ${duration}`, // Set the duration of the output video
    ])
    .output(outputFilePath) // Set output file path
    .on("end", () => {
      console.log(
        `Combined audio and image successfully. Output file: ${outputFilePath}`
      );
      if (typeof callback === "function") {
        callback(outputFilePath, duration);
      }
    })
    .on("error", (err) => {
      console.error(`Error: ${err.message}`);
    })
    .run();
}

// async function combineVideoAndAudio(
//   inputAudioPath,
//   inputVideoPath,
//   outputFilePath,
//   callback
// ) {
//   console.log("in the duration function");
//   const duration = await getDuration(inputVideoPath);
//   console.log("Video duration:", duration);
//   ffmpeg()
//     .input(inputAudioPath)
//     .input(inputVideoPath)
//     .videoCodec("libx264")
//     .audioCodec("aac")
//     .audioBitrate("192k") // Set audio bitrate
//     .size("1920x1080")
//     .videoBitrate("3000k") // Adjust video bitrate for better quality
//     .outputOptions([
//       "-pix_fmt yuv420p", // Set pixel format for compatibility
//       `-vf setpts=0.5*PTS`, // Adjust playback speed
//       "-preset ultrafast", // Set encoding preset for faster encoding
//       `-t ${duration}`, // Set the duration of the output video
//     ])
//     .output(outputFilePath) // Set output file path
//     .on("end", () => {
//       console.log(
//         `Combined audio and video successfully. Output file: ${outputFilePath}`
//       );
//       if (typeof callback === "function") {
//         callback(outputFilePath, duration);
//       }
//     })
//     .on("error", (err) => {
//       console.error(`Error: ${err.message}`);
//     })
//     .run();
// }

// Function to re-encode video

// Function to combine video and audio with streams

// Function to zip the output file

// function reencodeVideo(inputVideoPath) {
//   return new Promise((resolve, reject) => {
//     const outputVideoPath = path.join(path.dirname(inputVideoPath), 'temp_video.mp4');
//     const tempFileStream = fs.createWriteStream(outputVideoPath);

//     ffmpeg(inputVideoPath)
//       .videoCodec('libx264')
//       .audioCodec('aac')
//       .size('1920x1080')
//       .fps(30)
//       .on('end', () => resolve(outputVideoPath))
//       .on('error', (err) => reject(err))
//       .pipe(tempFileStream); // Stream directly to file
//   });
// }
// Function to get duration
// function getDuration(videoPath) {
//   return new Promise((resolve, reject) => {
//     ffmpeg.ffprobe(videoPath, (err, metadata) => {
//       if (err) {
//         return reject(err);
//       }
//       resolve(metadata.format.duration);
//     });
//   });
// }
function reencodeVideo(inputVideoPath) {
  return new Promise((resolve, reject) => {
    const outputVideoPath = path.join(
      path.dirname(inputVideoPath),
      "temp_video.mp4"
    );

    ffmpeg(inputVideoPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size("1920x1080")
      .fps(30)
      .on("end", () => resolve(outputVideoPath))
      .on("error", (err) => reject(err))
      .save(outputVideoPath); // Save directly to file instead of piping
  });
}
function getHardwareEncoder() {
  const platform = os.platform();
  const encoders = [
    { name: "h264_nvenc", hardware: "NVIDIA" },
    { name: "hevc_nvenc", hardware: "NVIDIA" },
    { name: "h264_qsv", hardware: "Intel" },
    { name: "hevc_qsv", hardware: "Intel" },
    { name: "h264_amf", hardware: "AMD" },
    { name: "hevc_amf", hardware: "AMD" },
  ];

  // Filter encoders based on platform (e.g., macOS doesn't support NVIDIA or AMD)
  const supportedEncoders = encoders.filter((encoder) => {
    if (platform === "darwin" && encoder.hardware !== "Intel") return false;
    if (platform === "linux" && encoder.hardware === "AMD") return false;
    return true;
  });

  // Try to detect available hardware encoder
  for (const encoder of supportedEncoders) {
    try {
      ffmpeg().addOptions(`-c:v ${encoder.name}`).run();
      return encoder.name;
    } catch (error) {
      continue;
    }
  }

  // Fall back to software encoding if no hardware encoder is found
  return "libx264";
}
// Function to combine video and audio with corrected options
async function combineVideoAndAudio(
  inputAudioPath,
  inputVideoPath,
  outputFilePath,
  callback
) {
  try {
    const videoCodec = getHardwareEncoder(); // Determine the best video codec

    const tempVideoPath = await reencodeVideo(inputVideoPath);
    const videoDuration = await getDuration(tempVideoPath);

    ffmpeg()
      .input(tempVideoPath) // First input: the video file
      .input(inputAudioPath) // Second input: the audio file
      .outputOptions([
        `-c:v ${videoCodec}`, // Use detected hardware or software encoder
        "-c:v copy", // Copy video stream without re-encoding
        "-c:v libx264", // Video codec
        "-c:a aac", // Audio codec
        "-b:a 128k", // Lower audio bitrate
        "-b:v 1500k", // Lower video bitrate
        "-s 1280x720", // Lower resolution (HD 720p)
        "-r 30", // Keep the frame rate at 30fps       // Frame rate
        "-pix_fmt yuv420p", // Pixel format
        `-t ${videoDuration}`, // Set output duration to match video
        "-preset superfast", // Encoding preset
        "-shortest", // Stop at the shortest input duration
        "-map 0:v:0", // Use video stream from the first input
        "-map 1:a:0", // Use audio stream from the second input
      ])
      .on("end", async () => {
        try {
          fs.unlinkSync(tempVideoPath); // Clean up the temporary video file
          if (typeof callback === "function") {
            callback(outputFilePath, videoDuration);
          }
        } catch (removeError) {
          console.error(`Error during cleanup: ${removeError.message}`);
        }
      })
      .on("error", (err) => {
        console.error(`Error during combining video and audio: ${err.message}`);
      })
      .save(outputFilePath); // Save the output file
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Function to get duration
function getDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      resolve(metadata.format.duration);
    });
  });
}
// Function to zip the output file
function zipOutputFile(outputFilePath, zipFilePath, callback) {
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    console.log(`Zip file created at ${zipFilePath}`);
    if (typeof callback === "function") {
      callback(zipFilePath);
    }
  });

  archive.on("error", (err) => {
    console.error(`Error during zipping: ${err.message}`);
  });

  archive.pipe(output);
  archive.file(outputFilePath, { name: path.basename(outputFilePath) });
  archive.finalize();
}

// Function to get duration
// function getDuration(videoPath) {
//   return new Promise((resolve, reject) => {
//     ffmpeg.ffprobe(videoPath, (err, metadata) => {
//       if (err) {
//         return reject(err);
//       }
//       resolve(metadata.format.duration);
//     });
//   });
// }

export const constdeleteS3Files = async (req, res, next) => {
  try {
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};
export const uploadCombineMedia = async (req, res, next) => {
  try {
    console.log("testing>>");

    const {
      title,
      mediaUrl,
      imageUrl,
      taggedPeople,
      description,
      videoDuration,
    } = req.body;
    const user = await usersModel
      .findById(req.user._id)
      .select("username avatar");
    const video = await vlogModel.create({
      title,
      mediaUrl,
      imageUrl,
      userId: req.user._id,
      taggedPeople,
      description,
      videoDuration,
    });
    console.log("api is hitting till there");
    let notification = await vlogModel.findById(video._id).populate({
      path: "taggedPeople",
      populate: {
        path: "devices",
        select: "deviceToken",
      },
    });
    console.log("noti>>", notification);
    const payload = {
      type: "tagged",
      id: video._id,
      userName: user.username,
      avatar: user.avatar,
      userId: user._id,
    };
    const title1 = "tagged";
    const body = `${user?.username} tagged you in a video`;
    console.log("hi>>>>");

    if (notification?.taggedPeople) {


      notification.taggedPeople.map(async (taggedPeople) => {
        if (taggedPeople?.devices && taggedPeople?.devices?.length > 0) {
        }
  
        await NotificationModel.create({
          userId: taggedPeople._id,
          body: body,
          payload: payload,
        });
        const count = await findNotificationCount(taggedPeople._id);
        console.log("harvey>>>>", count);
        notificationCountIO(count, taggedPeople._id);
        if (
          //  video.userId.devices.length > 0 &&
          taggedPeople.isNotification &&
          !taggedPeople.isDeleted
        ) {
          const notifications = taggedPeople?.devices?.map(async (devices) => {
     
            await sendNotificationWithPayload({
              token: devices?.deviceToken,
              body: body,
              data: payload,
              title: title1,
            });
          });
          if(notifications){
          await Promise.all(notifications);
        }
      }
      });
    }

    return res
      .status(200)
      .json(success("video added successfully", video, 200));
  } catch (error) {
    console.error(error.message)
    res.status(500).json(errors(error.message, 500));
  }
};

export const getComments = async (req, res, next) => {
  try {
    // const { vlogId } = req.body;
    const id = req.params.id;
    const getComments = await vlogCommentModel.find({ vlogId: id }).populate({
      path: "userId",
      select: "fullName username avatar",
    });
    const count = await vlogCommentModel.countDocuments({ vlogId: id });
    return res
      .status(200)
      .json(success("Get Comments successfully", { getComments, count }, 200));
  } catch (error) {
    console.error(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};
export const getLikes = async (req, res, next) => {
  try {
    // const { vlogId } = req.body;
    const id = req.params.id;
    const getLikes = await vlogLikesModel.find({ vlogId: id }).populate({
      path: "userId",
      select: "fullName username avatar",
    });
    const count = await vlogLikesModel.countDocuments({ vlogId: id });
    return res
      .status(200)
      .json(success("Get Likes successfully", { getLikes, count }, 200));
  } catch (error) {
    console.error(error.message);
    res.status(500).json(errors(error.message, 500));
  }
};

export const getVideoById = async (req, res, next) => {
  try {
    const { vlogId } = req.body;
    const video = await vlogModel.findById(vlogId);
    return res.status(200).json(success(""));
  } catch (error) {
    console.log(error.message, 500);
    res.status(500).json(errors(error.message, 500));
  }
};
export const getProfile = async (req, res, next) => {
  try {
    const myProfile = await usersModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params._id) },
      },
      {
        $lookup: {
          from: "vlogs",
          localField: "_id",
          foreignField: "userId",
          as: "videos",
        },
      },
      {
        $lookup: {
          from: "vlogs",
          localField: "_id",
          foreignField: "taggedPeople",
          as: "taggedVideos",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "taggedVideos.userId",
          as: "taggedUsers",
        },
      },
      {
        $lookup: {
          from: "vloglikes",
          localField: "_id",
          foreignField: "userId",
          as: "likedVlogs",
        },
      },
      {
        $lookup: {
          from: "vloglikes",
          localField: "videos._id",
          foreignField: "vlogId",
          as: "Likes",
        },
      },
      {
        $lookup: {
          from: "vloglikes",
          localField: "taggedVideos.taggedPeople",
          foreignField: "vlogId",
          as: "vlogLikes",
        },
      },
      {
        $lookup: {
          from: "vlogcomments",
          localField: "videos._id",
          foreignField: "vlogId",
          as: "Comments",
        },
      },
      {
        $addFields: {
          videos: {
            $map: {
              input: "$videos",
              as: "video",
              in: {
                $mergeObjects: [
                  "$$video",
                  {
                    isLiked: { $in: ["$$video._id", "$likedVlogs.vlogId"] },
                    likeCount: {
                      $size: {
                        $filter: {
                          input: "$Likes",
                          as: "like",
                          cond: { $eq: ["$$video._id", "$$like.vlogId"] },
                        },
                      },
                    },
                    commentsCount: {
                      $size: {
                        $filter: {
                          input: "$Comments",
                          as: "comments",
                          cond: { $eq: ["$$video._id", "$$comments.vlogId"] },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
          taggedVideos: {
            $map: {
              input: "$taggedVideos",
              as: "taggedVideo",
              in: {
                $mergeObjects: [
                  "$$taggedVideo",
                  {
                    isLiked: {
                      $in: ["$$taggedVideo._id", "$vlogLikes.vlogId"],
                    },
                    likeCount: {
                      $size: {
                        $filter: {
                          input: "$vlogLikes",
                          as: "like",
                          cond: { $eq: ["$$taggedVideo._id", "$$like.vlogId"] },
                        },
                      },
                    },
                    commentsCount: {
                      $size: {
                        $filter: {
                          input: "$Comments",
                          as: "comments",
                          cond: {
                            $eq: ["$$taggedVideo._id", "$$comments.vlogId"],
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          username: 1,
          avatar: 1,
          videos: {
            _id: 1,
            title: 1,
            userId: 1,
            mediaType: 1,
            mediaUrl: 1,
            imageUrl: 1,
            taggedPeople: 1,
            description: 1,
            videoDuration: 1,
            createdAt: 1,
            updatedAt: 1,
            isLiked: 1,
            likeCount: 1,
            commentsCount: 1,
          },
          taggedVideos: {
            _id: 1,
            title: 1,
            description: 1,
            userId: 1,
            mediaType: 1,
            mediaUrl: 1,
            imageUrl: 1,
            taggedPeople: 1,
            likeCount: 1,
            isLiked: 1,
            commentsCount: 1,
          },
        },
      },
    ]);

    return res.status(200).json(success("My Profile", myProfile, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const seenNotifications = await NotificationModel.updateMany(
      { userId: req.user._id },
      { isRead: true }
    );

    const notifications = await NotificationModel.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });
    return res.status(200).json(success("notifications", notifications, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};
export const getNotificationss = async (body) => {
  try {
    const notifications = await NotificationModel.find({
      userId: body.userId,
    }).sort({ createdAt: -1 });
    return res.status(200).json(success("notifications", notifications, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};

export const getData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const getData = await vlogModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "vloglikes",
          localField: "_id",
          foreignField: "vlogId",
          as: "likedVlogs",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      {
        $lookup: {
          from: "vlogcomments",
          localField: "_id",
          foreignField: "vlogId",
          as: "Comments",
        },
      },
      {
        $addFields: {
          isLiked: {
            $in: ["$_id", "$likedVlogs.vlogId"],
          },
          likeCount: {
            $size: "$likedVlogs",
          },
          commentsCount: {
            $size: "$Comments",
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,

          mediaType: 1,
          mediaUrl: 1,
          imageUrl: 1,
          userId: {
            _id: 1,
            avatar: 1,
            fullName: 1,
            username: 1,
          },
          taggedPeople: 1,
          description: 1,
          videoDuration: 1,
          createdAt: 1,
          updatedAt: 1,
          isLiked: 1,
          likeCount: 1,
          commentsCount: 1,
        },
      },
    ]);
    return res.status(200).json(success("getData", getData, 200));
  } catch (error) {
    res.status(500).json(errors(error.message, 500));
  }
};
