const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
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
    const userId = req.user.id;
    if (!userId) {
      return cb(new Error("User ID is required"), false);
    }
    let basePath = "";
    if (file.fieldname === "profile") {
      basePath = path.join("uploads", "profiles", `user_${userId}`);
    } else if (file.fieldname === "cover") {
      basePath = path.join("uploads", "covers", `user_${userId}`);
    } else if (file.fieldname === "audio") {
      basePath = path.join("uploads", "audios", `user_${userId}`);
    } else {
      cb(new Error("Invalid file field"), false);
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
      return cb(new Error("Invalid file field"));
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
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
