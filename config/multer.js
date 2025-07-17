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
    if (file.fieldname === "profile") {
      cb(null, "uploads/profiles/");
    } else if (file.fieldname === "cover") {
      cb(null, "uploads/covers/");
    } else if (file.fieldname === "audio") {
      cb(null, "uploads/audios/");
    } else {
      cb(new Error("Invalid file field"), false);
    }
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, `user_${req.user.id}.${file.originalname.split(".").pop()}`);
  },
});
const fileFilter = (req, file, cb) => {
  console.log("happening");
  if (file.fieldname === "audio" && audioMimeTypes.includes(file.mimetype)) {
    console.log("done");
    cb(null, true);
  } else if (
    file.fieldname === "cover" &&
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
