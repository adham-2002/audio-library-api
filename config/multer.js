const multer = require("multer");
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
    if (file.fieldname === "profilePhoto") {
      cb(null, "uploads/profiles/");
    } else if (file.fieldname === "coverPhoto") {
      cb(null, "uploads/covers/");
    } else if (file.fieldname === "audio") {
      cb(null, "uploads/audios/");
    } else {
      cb(new Error("Invalid file field"), false);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "audio" && audioMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (
    file.fieldname === "photo" &&
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
