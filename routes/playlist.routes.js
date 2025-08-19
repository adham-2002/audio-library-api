const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createNewPlaylist,
  updatePlaylist,
  addAudioToPlaylist,
  getPlaylist,
  getPublicPlaylist,
  getAllPlaylists,
  removeFromPlaylist,
  deletePlaylist,
  sharePlaylist,
  getSharedPlaylist,
} = require("../controllers/playlist.controller");

const router = express.Router();

router.get("/", authMiddleware(["user", "admin"]), getPublicPlaylist);
router.get("/:playlistId", authMiddleware(["user", "admin"]), getPlaylist);
router.get("/:playlistId/mine", authMiddleware(["user", "admin"]), getPlaylist);
router.get("/mine", authMiddleware(["user", "admin"]), getAllPlaylists);
router.post("/", authMiddleware(["user", "admin"]), createNewPlaylist);
router.put("/:playlistId", authMiddleware(["user", "admin"]), updatePlaylist);
router.patch(
  "/:playlistId",
  authMiddleware(["user", "admin"]),
  addAudioToPlaylist
);
router.delete(
  "/:playlistId/audios/:audioId",
  authMiddleware(["user", "admin"]),
  removeFromPlaylist
);
router.delete(
  "/:playlistId",
  authMiddleware(["user", "admin"]),
  deletePlaylist
);

router.post(
  "/:playlistId/share",
  authMiddleware(["user", "admin"]),
  sharePlaylist
);
router.get(
  "/shared/:token",
  authMiddleware(["user", "admin"]),
  getSharedPlaylist
);
module.exports = router;
