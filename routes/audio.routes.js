const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const checkAudioOwnership = require("../middlewares/checkAudioOwnership");
const upload = require("../config/multer");
const {
  uploadLimiter,
  criticalLimiter,
} = require("../middlewares/rateLimiter");
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

// Upload audio (needs rate limiting to prevent spam)
router.post(
  "/audio",
  uploadLimiter, // 10 uploads per hour
  authMiddleware(["user", "admin"]),
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uploadAudioValidator,
  uploadAudio
);

// Get public audios (no rate limiting - public browsing should be free)
router.get("/audios", getPublicAudios);

// Get user's audios (no rate limiting - user's own data)
router.get("/audios/me", authMiddleware(["user"]), getUserAudios);

// Get specific audio (no rate limiting - simple read operation)
router.get(
  "/audios/:audioId",
  authMiddleware(["user", "admin"]),
  checkAudioOwnership,
  getSpecificAudio
);

// Stream audio (no rate limiting - music consumption should be smooth)
router.get(
  "/audios/stream/:audioId",
  authMiddleware(["user", "admin"]),
  checkAudioOwnership,
  streamAudioValidator,
  streamAudio
);

// Get popular audios (no rate limiting - public data)
router.get(
  "/audios/popular",
  authMiddleware(["user", "admin"]),
  getMostPopularAudios
);

// Get new releases (no rate limiting - public data)
router.get("/audio/new-releases", getNewRelease);

// Update audio (needs rate limiting when files are involved)
router.put(
  "/audios/:audioId",
  uploadLimiter, // 10 updates per hour (only when files involved)
  authMiddleware(["admin", "user"]),
  checkAudioOwnership,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  updateAudioValidator,
  updateAudio
);

// Delete audio (needs rate limiting - critical operation)
router.delete(
  "/audio/:audioId",
  criticalLimiter, // 20 deletions per hour
  authMiddleware(["user", "admin"]),
  checkAudioOwnership,
  deleteAudioValidator,
  deleteAudio
);

module.exports = router;
