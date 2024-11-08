import { config } from "dotenv";
config();

const ffmpegConfig = {
  FFMPEG_PATH: process.env.FFMPEG_PATH,
  FFPROBE_PATH: process.env.FFPROBE_PATH,
  FLVTOOL_PATH: process.env.FLVTOOL_PATH,
};

export default ffmpegConfig;
