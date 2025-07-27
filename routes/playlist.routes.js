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
  deletePlaylist
} = require("../controllers/playlist.controller");

const router = express.Router();

router.get("/playlists", authMiddleware(["user", "admin"]), getPublicPlaylist);
router.get("/playlists/:playlistId", authMiddleware(["user", "admin"]), getPlaylist);
router.get("/playlists/:playlistId/mine", authMiddleware(["user", "admin"]), getPlaylist);
router.get("/playlists/mine",authMiddleware(["user", "admin"]), getAllPlaylists)
router.post("/playlists", authMiddleware(["user", "admin"]), createNewPlaylist);
router.put(
  "/playlists/:playlistId",
  authMiddleware(["user", "admin"]),
  updatePlaylist
);
router.patch(
  "/playlists/:playlistId",
  authMiddleware(["user", "admin"]),
  addAudioToPlaylist
);
router.delete(
  "/playlists/:playlistId/audios/:audioId",
  authMiddleware(["user", "admin"]),
  removeFromPlaylist
);

router.delete("/playlists/:playlistId",authMiddleware(["user","admin"]),deletePlaylist)
module.exports = router;
