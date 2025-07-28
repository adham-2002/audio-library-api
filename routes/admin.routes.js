const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getAllAudios } = require("../controllers/admin.controller");
const router = express.Router();

router.get("/admin/audios", authMiddleware("admin"), getAllAudios);
module.exports = router;
