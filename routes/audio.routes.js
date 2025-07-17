const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multer");
const router = express.Router();
const { uploadAudio } = require("../controllers/audio.controller");
router.post(
  "/audio",
  authMiddleware,
  upload.fields([{ name: "audio" }, { name: "cover" }]),
  uploadAudio
);

router.get("/audio", (req, res) => {});

router.get("/audio/mine", (req, res) => {});

router.get("/audio/stream/:id", (req, res) => {});

router.put("/audio/:id", () => {});

router.delete("/audio/:id", () => {});

module.exports = router;
