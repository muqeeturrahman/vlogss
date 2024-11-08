import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import http from "http";
import cors from "cors";
// import dbConnection from "./config/dbConnection.js";
import { userRouter } from "./routes/user.js";
import { vlogRouter } from "./routes/vlog.js";
import { inviteRouter } from "./routes/invite.js";
import { settingsRouter } from "./routes/setting.js";
import { friendsRouter } from "./routes/friends.js";
import { rateRouter } from "./routes/rate.js";
import { helpRouter } from "./routes/help.js";
import { privacyPolicyRouter } from "./routes/privacyPolicy.js";
import { adminRouter } from "./routes/admin.js";
import Ffmpeg from "fluent-ffmpeg";
import ffempgPath from "@ffmpeg-installer/ffmpeg";
import ffprobePath from "@ffprobe-installer/ffprobe";
import { Server } from "socket.io";
import { socketEventListner } from "./socketEventListener.js";

console.log(process.env.LOCALDB);

const app = express();
const server = http.createServer(app);

export const io = new Server(server); // for online

const port = process.env.PORT || 5000;
io.addListener("connection", socketEventListner);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.json())
app.use(cors());

app.use("/uploads/userProfile/", express.static("uploads/userProfile/"));
try {
  Ffmpeg.setFfmpegPath(ffempgPath.path);
  Ffmpeg.setFfprobePath(ffprobePath.path);
} catch (error) {
  console.log("Some error occured on ffempg");
}

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const logEndpoint = (req, res, next) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  console.log(`Endpoint Hit: ${baseUrl}/${req.originalUrl}`);
  next(); // Move to the next middleware or route handler
};

app.use(logEndpoint);

// Routes
app.use("/api/user", userRouter);
app.use("/api/user", vlogRouter);
app.use("/api/invite", inviteRouter);
app.use("/api/setting", settingsRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/rate", rateRouter);
app.use("/api/help", helpRouter);
app.use("/api/privacyPolicy", privacyPolicyRouter);
app.use("/api/admin", adminRouter);

server.listen(port, () => {
  console.log("Listening on port " + port);
});

mongoose
  .connect(process.env.LOCALDB)
  .then(() => console.log("connected to mongodb"))
  .catch(() => console.log("could not connect to mongodb"));
