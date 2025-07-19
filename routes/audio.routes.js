const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multer");
const router = express.Router();
const {
  uploadAudio,
  getPublicAudios,
  getUserAudios,
  deleteAudio,
  updateAudio
} = require("../controllers/audio.controller");
router.post(
  "/audio",
  authMiddleware(),
  upload.fields([{ name: "audio" }, { name: "cover" }]),
  uploadAudio
);



router.get("/audio", getPublicAudios);

router.get("/audio/mine", authMiddleware(), getUserAudios);

router.get("/audio/stream/:id", (req, res) => {});

router.put("/audio/:id",authMiddleware(),upload.single({name:"cover"}),updateAudio);

router.delete("/audio/:id", authMiddleware(), deleteAudio);

module.exports = router;
