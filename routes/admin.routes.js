const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { deleteAudioAdmin } = require("../controllers/admin.controller");
const router = express.Router();

router.delete("/admin/audios/:id", authMiddleware("admin"), deleteAudioAdmin);

module.exports = router;
