const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware');
const {getAllAudio, deleteAudioAdmin } = require('../controllers/admin.controller');
const router = express.Router();


router.get('/admin/audios',authMiddleware('admin'),getAllAudio)
router.delete('/admin/audio/:id',authMiddleware('admin'),deleteAudioAdmin)

module.exports = router