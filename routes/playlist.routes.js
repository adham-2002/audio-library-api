const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createNewPlaylist,
  UpdatePlaylist,
  addAudioToPlaylist,
  getPublicPlaylist,
  getAllPlaylists,
  removeFromPlaylist,
} = require("../controllers/playlist.controller");

const router = express.Router();

router.get("/playlists", authMiddleware(["user", "admin"]), getPublicPlaylist);
router.get("/playlists/mine",authMiddleware(["user", "admin"]), getAllPlaylists)
router.post("/playlist", authMiddleware(["user", "admin"]), createNewPlaylist);
router.put(
  "/playlist/:playlistId",
  authMiddleware(["user", "admin"]),
  UpdatePlaylist
);
router.patch(
  "/playlist/:playlistId/add-audio",
  authMiddleware(["user", "admin"]),
  addAudioToPlaylist
);
router.delete(
  "/playlist/:playlistId",
  authMiddleware(["user", "admin"]),
  removeFromPlaylist
);

module.exports = router;
