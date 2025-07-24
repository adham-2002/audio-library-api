const express = require('express')
const { createNewPlaylist, UpdatePlaylist, addAudioToPlaylist, getPublicPlaylist} = require('../controllers/playlist.controller')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()

router.get('/playlists',authMiddleware(["user", "admin"]), getPublicPlaylist)
router.post('/playlist',authMiddleware(["user", "admin"]), createNewPlaylist)
router.put('/playlist/:playlistId',authMiddleware(["user", "admin"]),UpdatePlaylist)
router.patch('/playlist/:playlistId/add-audio',authMiddleware(['user','admin']),addAudioToPlaylist)

module.exports = router