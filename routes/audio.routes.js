const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multer");
const router = express.Router();
const {
  uploadAudio,
  getPublicAudios,
  getUserAudios,
  deleteAudio,
  streamAudio,
  updateAudio,
} = require("../controllers/audio.controller");
router.post(
  "/audio",
  authMiddleware(["user", "admin"]),
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uploadAudio
);

router.get("/audio", getPublicAudios);

router.get("/audio/mine", authMiddleware(), getUserAudios);

router.get("/audio/stream/:audioId", streamAudio);

router.put(
  "/audio/:audioId",
  authMiddleware(["admin", "user"]),
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  updateAudio
);

router.delete("/audio/:audioId", authMiddleware(), deleteAudio);

module.exports = router;
