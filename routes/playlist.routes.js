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
} = require("../controllers/playlist.controller");

const router = express.Router();

router.get("/playlists", authMiddleware(["user", "admin"]), getPublicPlaylist);
router.get("/playlist/:playlistId", authMiddleware(["user", "admin"]), getPlaylist);
router.get("/playlist/:playlistId/mine", authMiddleware(["user", "admin"]), getPlaylist);
router.get("/playlists/mine",authMiddleware(["user", "admin"]), getAllPlaylists)
router.post("/playlist", authMiddleware(["user", "admin"]), createNewPlaylist);
router.put(
  "/playlist/:playlistId",
  authMiddleware(["user", "admin"]),
  updatePlaylist
);
router.patch(
  "/playlist/:playlistId",
  authMiddleware(["user", "admin"]),
  addAudioToPlaylist
);
router.delete(
  "/playlist/:playlistId",
  authMiddleware(["user", "admin"]),
  removeFromPlaylist
);

module.exports = router;
