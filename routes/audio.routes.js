const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const checkAudioOwnership = require("../middlewares/checkAudioOwnership");
const upload = require("../config/multer");
const router = express.Router();
const {
  uploadAudio,
  getPublicAudios,
  getUserAudios,
  getSpecificAudio,
  deleteAudio,
  streamAudio,
  updateAudio,
  getMostPopularAudios,
  getNewRelease,
} = require("../controllers/audio.controller");
const {
  uploadAudioValidator,
  updateAudioValidator,
  deleteAudioValidator,
  streamAudioValidator,
} = require("../utils/validators/audioValidator");

router.post(
  "/audio",
  authMiddleware(["user", "admin"]),
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uploadAudioValidator,
  uploadAudio
);

router.get("/audios", getPublicAudios);

router.get("/audios/me", authMiddleware(["user"]), getUserAudios);
router.get(
  "/audios/:audioId",
  authMiddleware(["user", "admin"]),
  checkAudioOwnership,
  getSpecificAudio
);
router.get(
  "/audios/stream/:audioId",
  authMiddleware(["user", "admin"]),
  checkAudioOwnership,
  streamAudioValidator,
  streamAudio
);

router.get(
  "/audios/popular",
  authMiddleware(["user", "admin"]),
  getMostPopularAudios
);

router.get("/audio/new-releases", getNewRelease);

router.put(
  "/audios/:audioId",
  authMiddleware(["admin", "user"]),
  checkAudioOwnership,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  updateAudioValidator,
  updateAudio
);

router.delete(
  "/audio/:audioId",
  authMiddleware(["user", "admin"]),
  checkAudioOwnership,
  deleteAudioValidator,
  deleteAudio
);

module.exports = router;
