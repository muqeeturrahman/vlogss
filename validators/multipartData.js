// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const StorageForBoth = multer.diskStorage({
//   destination: (req, file, callback) => {
//     // callback(null, path.join("public", "uploads"));
//     callback(null, path.join("uploads","userProfile"));
//   },
// //   "./uploads/userProfile"
//   filename: (req, file, callback) => {
//     const fileName = file.originalname.split(" ").join("-");
//     const extension = path.extname(fileName);
//     const baseName = path.basename(fileName, extension);
//     callback(null, baseName + "-" + Date.now() + extension);
//   },
// });
// export const handleMultipartDataForBoth = multer({
//   // storage: multer.memoryStorage(),
//   storage: StorageForBoth,
//   limits: {
//     fileSize: 1024 * 1024 * 100,
//   },
//   fileFilter: (req, file, callback) => {
//     const FileTypes = /jpeg|jpg|png|gif|avif|mp4|mkv|webm|vid|avif|avi/;
//     const mimType = FileTypes.test(file.mimetype);
//     const extname = FileTypes.test(path.extname(file.originalname));
//     console.log("MIME type:", file.mimetype); // Log the MIME type
//     console.log("Extension:", path.extname(file.originalname)); // Log the extension
//     if (mimType && extname) {
//       return callback(null, true);
//     }
//     return callback(new Error("File type not supported"), false);
//   },
// });
// export const Storage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, path.join("uploads"));
//   },
//   filename: (req, file, callback) => {
//     const fileName = file.originalname.split(" ").join("-");
//     const extension = path.extname(fileName);
//     const baseName = path.basename(fileName, extension);
//     callback(null, baseName + "-" + Date.now() + extension);
//   },
// });

// export const handleMultipartData = multer({
//   storage: Storage,
//   limits: {
//     fileSize: 1024 * 1024 * 100,
//   },
//   fileFilter: (req, file, callback) => {
//     const FileTypes = /jpeg|jpg|png|gif|pdf|docx|doc|PNG/;
//     const mimType = FileTypes.test(file.mimetype);
//     const extname = FileTypes.test(path.extname(file.originalname));
//     if (mimType && extname) {
//       return callback(null, true);
//     }
//     callback(new Error("File type not supported"));
//   },
// });
import multer from "multer";
import path, { dirname } from "path";
import S3Config from "../config/s3Config.js";
import multers3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const s3 = new S3Client({
  region: S3Config.AWS_REGION,
  credentials: {
    accessKeyId: S3Config.AWS_ACCESS_KEY,
    secretAccessKey: S3Config.AWS_SECRET_ACCESS_KEY,
  },
});

export const Storage = multers3({
  s3: s3,
  bucket: S3Config.S3_BUCKET_NAME,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const fileName = Date.now() + "-" + file.originalname;
    file.originalname = fileName;
    cb(null, fileName);
  },
});
export const localStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "..", "uploads", "userProfile"));
  },
  filename: (req, file, callback) => {
    const fileName = file.originalname.split(" ").join("-");
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    callback(null, baseName + "-" + Date.now() + extension);
  },
});

export const handleMultipartData = multer({
  // storage: Storage,
  storage:localStorage,
  
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1 GB
  },
  fileFilter: (req, file, callback) => {
    const FileTypes = /jpeg|jpg|png|gif|mp4|mp3|mpeg/;
    const isValidFile = FileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (isValidFile) {
      callback(null, true);
    } else {
      callback(new Error("File type not supported"), false);
    }
  },
});

export const handleMultipartDataForProjects = multer({
  storage: localStorage,
  limits: {
    fileSize: 1024 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const FileTypes = /jpeg|jpg|png|gif|mp4|mpeg/;
    const isValidFile = FileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (isValidFile) {
      callback(null, true);
    } else {
      callback(new Error("File type not supported"), false);
    }
  },
});
export const handleMultipartDataForBoth = multer({
  // storage: multer.memoryStorage(),
  storage: localStorage,
  limits: {
    fileSize: 1024 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const FileTypes = /jpeg|jpg|png|gif|avif|mp4||mp3|mkv|webm|vid|avif|avi/;
    const mimType = FileTypes.test(file.mimetype);
    const extname = FileTypes.test(path.extname(file.originalname));
    console.log("MIME type:", file.mimetype); // Log the MIME type
    console.log("Extension:", path.extname(file.originalname)); // Log the extension
    if (mimType && extname) {
      return callback(null, true);
    }
    return callback(new Error("File type not supported"), false);
  },
});
