import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import S3Config from "../config/s3Config.js";
// import path from "path";
import Ffmpeg from "fluent-ffmpeg";
import { readFileSync, unlinkSync } from "fs";
import CustomError from "../helpers/customError.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import AWS from "aws-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { S3_BUCKET_NAME, AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, AWS_REGION } =
  S3Config;
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION, // Set your AWS region
});

const S3 = new AWS.S3();

// Create a new instance of the S3 class
const s3 = new AWS.S3();
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});
export async function uploadFileToS3(output, outputFileName) {
  console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", output, outputFileName);

  const fileStream = fs.createReadStream(output);
  // console.log(fileStream);
  // return fileStream;
  // Setting up S3 upload parameters
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: "upload/output/" + outputFileName,
    Body: fileStream,
  };

  // Uploading files to the bucket
  const uploadPromise = new Promise((resolve, reject) => {
    S3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });

  try {
    const data = await uploadPromise;
    console.log(`File uploaded successfully. Location: ${data.Location}`);
    return data.Location;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}
export async function deleteObjectFromS3(key) {
  console.log("sssssssssssssssssssssssssssssssssssssssssss", S3_BUCKET_NAME);
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
  };

  try {
    await S3.deleteObject(params).promise();
    console.log(
      `Object deleted successfully from S3 bucket: ${S3_BUCKET_NAME}/${key}`
    );
  } catch (error) {
    console.error(
      `Error deleting object from S3 bucket: ${S3_BUCKET_NAME}/${key}`,
      error
    );
    throw error;
  }
}
export const videoThumbnail = async (req, res, next) => {
  try {
    console.log("files>>>>>", req.files);

    console.log("api is hitting");
    console.log("a");
    if (
      req.files?.inputVideoPath?.length > 0 &&
      req.files.inputVideoPath[0].mimetype.split("/")[0] === "video"
    ) {
      console.log("b");
      const thumbnailbasename = Date.now() + "-thumbnail.png";
      const mediaThumbnail = path.join(
        __dirname,
        "..",
        "uploads",
        "userProfile",
        thumbnailbasename
      );

      req.thumbnailName = thumbnailbasename;

      await new Promise((resolve, reject) => {
        Ffmpeg(req.files.inputVideoPath[0].path)
          .seekInput("00:00:01")
          .frames(1)
          .output(mediaThumbnail)
          .on("error", (err) => {
            reject(
              new CustomError(
                "Something went wrong while compressing video thumbnail " + err,
                400
              )
            );
          })
          .on("end", () => {
            resolve();
          })
          .run();
      });

      // Uploading thumbnail to S3
      const thumb = readFileSync(mediaThumbnail);
      const b = await new Upload({
        client: s3Client,
        params: {
          Bucket: S3_BUCKET_NAME,
          Key: "uploads/" + thumbnailbasename,
          Body: thumb,
          ContentType: "image/png",
        },
        leavePartsOnError: false,
      }).done();
      console.log(b);
      // unlinkSync(mediaThumbnail); // Clean up the thumbnail
      // unlinkSync(req.file.path); // Clean up the video file
    }
    console.log("c");
    return next();
  } catch (error) {
    console.log("d");

    return next(error); // Pass the error to the next middleware
  }
  // Proceed to the next middleware
  return next();
};

export const UploadS3 = async (req, res, next) => {
  try {
    console.log("files>>>>>", req.files);

    console.log("api is hitting ");

    if (req.files.video[0].mimetype.split("/")[0] === "video") {
      const thumbnailbasename = Date.now() + "-thumbnail.png";
      const mediaThumbnail = path.join(
        __dirname,
        "..",
        "uploads",
        "userProfile",
        thumbnailbasename
      );

      req.thumbnailName = thumbnailbasename;

      await new Promise((resolve, reject) => {
        Ffmpeg(req.files.video[0].path)
          .seekInput("00:00:01")
          .frames(1)
          .output(mediaThumbnail)
          .on("error", (err) => {
            reject(
              new CustomError(
                "Something went wrong while compressing video thumbnail " + err,
                400
              )
            );
          })
          .on("end", () => {
            resolve();
          })
          .run();
      });

      // Uploading thumbnail to S3
      const thumb = readFileSync(mediaThumbnail);
      const b = await new Upload({
        client: s3Client,
        params: {
          Bucket: S3_BUCKET_NAME,
          Key: "uploads/" + thumbnailbasename,
          Body: thumb,
          ContentType: "image/png",
        },
        leavePartsOnError: false,
      }).done();
      console.log(b);
      // unlinkSync(mediaThumbnail); // Clean up the thumbnail

      // Uploading video to S3
      const fileName = req.files.video[0].originalname.split(" ").join("-");
      const extension = path.extname(fileName);
      const vid = readFileSync(req.files.video[0].path);

      req.files.video[0].originalname =
        fileName.split(extension).join("") + "-" + Date.now() + extension;
      req.baseName = req.files.video[0].originalname;

      const a = await new Upload({
        client: s3Client,
        params: {
          Bucket: S3_BUCKET_NAME,
          Key: "uploads/" + req.files.video[0].originalname,
          Body: vid,
          ContentType: req.files.video[0].mimetype,
        },
        leavePartsOnError: false,
      }).done();
      console.log(a);
      console.log("mimetype>>>>>>>>>>>>>>fs");

      // unlinkSync(req.file.path); // Clean up the video file
    }
  } catch (error) {
    return next(error); // Pass the error to the next middleware
  }
  next(); // Proceed to the next middleware
};

export const uploadImageToS3 = async (req, res, next) => {
  try {
    const fileName = req.file.originalname.split(" ").join("-");
    const extension = path.extname(fileName);
    const vid = readFileSync(req.file.path);

    req.file.originalname =
      fileName.split(extension).join("") + "-" + Date.now() + extension;
    req.baseName = req.file.originalname;

    const a = await new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET_NAME,
        Key: "uploads/" + req.file.originalname,
        Body: vid,
        ContentType: req.file.mimetype,
      },
      leavePartsOnError: false,
    }).done();
    console.log(a);
    console.log("mimetype>>>>>>>>>>>>>>fs");
  } catch (error) {
    return next(error); // Pass the error to the next middleware
  }
  next(); // Proceed to the next middleware
};

export const UploadMultipleFilesToS3 = async (req, res, next) => {
  try {
    if (!req.files.images) {
      return next();
    }
    const { images } = req.files;

    await Promise.all(
      images.map(async (image) => {
        const imageUrl = image.originalname.split(" ").join("-");
        const extension = path.extname(imageUrl);
        const profileNewUrl =
          imageUrl.split(extension).join("") + "-" + Date.now() + extension;
        image.imageUrl = profileNewUrl;

        await new Upload({
          client: s3Client,
          params: {
            Bucket: S3_BUCKET_NAME,
            Key: "uploads/" + profileNewUrl,
            Body: image.buffer,
            ContentType: image.mimetype,
          },
          leavePartsOnError: false,
        }).done();
      })
    );
  } catch (error) {
    return next(error); // Pass the error to the next middleware
  }
  next(); // Proceed to the next middleware
};

// export async function deleteObject(bucketName, objectKey, type) {
//   const client = new S3Client({ region: "eu-west-1" });

//   try {
//     const command = new DeleteObjectCommand({
//       Bucket: S3_BUCKET_NAME,
//       Key: "uploads/" + objectKey,
//     });
//     await client.send(command);
//     console.log("Object deleted:", "uploads/" + thumbnailbasename);
//   } catch (err) {
//     console.error("Error", err);
//     throw err;
//   }
// }
export const uploadImgToS3 = async (req, res, next) => {
  
    const fileName = req.file.originalname.split(" ").join("-");
    const extension = path.extname(fileName);
    const vid = readFileSync(req.file.path);

    req.file.originalname =
      fileName.split(extension).join("") + "-" + Date.now() + extension;
    req.baseName = req.file.originalname;

    const a = await new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET_NAME,
        Key: "uploads/" + req.file.originalname,
        Body: vid,
        ContentType: req.file.mimetype,
      },
      leavePartsOnError: false,
    }).done();
    console.log(a);
    console.log("mimetype>>>>>>>>>>>>>>fs");
  
// Proceed to the next middleware
};