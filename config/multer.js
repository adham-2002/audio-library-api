const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
const apiError = require("../utils/apiError");
// upload profile photo
// upload cover photo + audio file
const photoMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/jpg",
];
const audioMimeTypes = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp3",
  "audio/flac",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // For audio/cover updates, use audio owner's ID if available
    // For new uploads or profile updates, use current user's ID
    let userId = req.user.id;

    if (!userId) {
      return cb(new apiError("User ID is required", 401), false);
    }

    let basePath = "";
    if (file.fieldname === "profile") {
      basePath = path.join("uploads", "profiles", `user_${userId}`);
    } else if (file.fieldname === "cover") {
      basePath = path.join("uploads", "covers", `user_${userId}`);
    } else if (file.fieldname === "audio") {
      basePath = path.join("uploads", "audios", `user_${userId}`);
    } else {
      cb(new apiError("Invalid file field", 400), false);
    }
    fs.mkdir(basePath, { recursive: true })
      .then(() => cb(null, basePath))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    let filename = "";
    if (file.fieldname === "profile") {
      filename = `profile${ext}`;
    } else if (file.fieldname === "cover") {
      filename = `cover_${timestamp}${ext}`;
    } else if (file.fieldname === "audio") {
      filename = `audio_${timestamp}${ext}`;
    } else {
      return cb(new apiError("Invalid file field", 400));
    }
    cb(null, filename);
  },
});
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "audio" && audioMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (
    ["cover", "profile"].includes(file.fieldname) &&
    photoMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new apiError("Invalid file type", 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
