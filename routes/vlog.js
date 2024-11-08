import { Router } from "express";
import { UploadS3 } from "../validators/generateThumbnail.js";
// import { videoThumbnail } from "../validators/generateThumbnail.js";
import {
  addVideo,
  getMyProfile,
  myProfile2,
  homeScreen,
  editVideo,
  deleteVideo,
  videosByDates,
  likeVideo,
  CommentVlog,
  getUserFriendsById,
  combineMedia,
  combineAudioAndVideo,
  deleteFromBucket,
  uploadCombineMedia,
  getComments,
  getLikes,
  getProfile,
  getNotifications,
  getData,
} from "../controller/vlogController.js";
import usersMiddleware from "../middleware/usersMiddleware.js";
import { handleMultipartDataForBoth } from "../validators/multipartData.js";
export let vlogRouter = Router();

vlogRouter.route("/addVideo").post(
  usersMiddleware,
  handleMultipartDataForBoth.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 }, // Add a field for the image
  ]),
  [UploadS3, addVideo]
);

vlogRouter.route("/MyProfile").get([usersMiddleware, getMyProfile]);
vlogRouter.route("/profile2").get([usersMiddleware, myProfile2]);

vlogRouter.route("/homeScreen").get([usersMiddleware, homeScreen]);
vlogRouter.route("/editVideo").put([usersMiddleware, editVideo]);
vlogRouter.route("/deleteVideo/:id").delete([usersMiddleware, deleteVideo]);
vlogRouter.route("/calendar").get([usersMiddleware, videosByDates]);
vlogRouter.route("/likeVideo").post([usersMiddleware, likeVideo]);
vlogRouter.route("/commentVideo").post([usersMiddleware, CommentVlog]);
vlogRouter.route("/combineMedia").post([
  // usersMiddleware,
  handleMultipartDataForBoth.fields([
    { name: "inputAudioPath", maxCount: 1 },
    { name: "inputImagePath", maxCount: 1 },
    { name: "inputVideoPath", maxCount: 1 },
    { name: "Image", maxCount: 1 },
  ]),

  combineMedia,
]);

vlogRouter.route("/combineAudioAndVideo").post([
  usersMiddleware,
  handleMultipartDataForBoth.fields([
    { name: "inputAudioPath", maxCount: 1 },
    { name: "inputVideoPath", maxCount: 1 },
    { name: "Image", maxCount: 1 },
    { name: "inputImagePath", maxCount: 1 },
  ]),
  combineAudioAndVideo,
]);
vlogRouter
  .route("/delete-form-bucket")
  .post([usersMiddleware, deleteFromBucket]);

vlogRouter
  .route("/getUserFriendsById")
  .post([usersMiddleware, getUserFriendsById]);
route: vlogRouter.route("/UploadMedia").post([
  usersMiddleware,
  handleMultipartDataForBoth.fields([
    { name: "inputAudioPath", maxCount: 1 },
    { name: "inputImagePath", maxCount: 1 },
    { name: "inputVideoPath", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  // videoThumbnail,
  uploadCombineMedia,
]);
vlogRouter.route("/getComments/:id").get([usersMiddleware, getComments]);
vlogRouter.route("/getLikes/:id").get([usersMiddleware, getLikes]);
vlogRouter.route("/Profile/:_id").get([usersMiddleware, getProfile]);
vlogRouter.route("/getNotifications").get([usersMiddleware, getNotifications]);
vlogRouter.route("/getData/:id").get([usersMiddleware, getData]);
