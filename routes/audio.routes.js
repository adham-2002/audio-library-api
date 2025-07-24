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
  getMostPopularAudios,
  getNewRelease
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

router.get("/audios", getPublicAudios);

router.get("/audios/me", authMiddleware(["user", "admin"]), getUserAudios);


router.get(
  "/audios/stream/:audioId",
  authMiddleware(["user", "admin"]),
  streamAudio
);
router.get("/audios/stream/:audioId", authMiddleware(["user","admin"]),streamAudio);

router.get("/audios/popular",authMiddleware(["user", "admin"]), getMostPopularAudios);

router.get('/audio/new-releases', getNewRelease);

router.put(
  "/audios/:audioId",
  authMiddleware(["admin", "user"]),
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  updateAudio
);

router.delete(
  "/audio/:audioId",
  authMiddleware(["user", "admin"]),
  deleteAudio
);

module.exports = router;
