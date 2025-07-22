const Audio = require("../models/audio.model");
const path = require("path");
const fs = require("fs").promises;
const apiError = require("../utils/apiError");

const deleteAudioAdmin = async (req, res, next) => {
  const audioId = req.params.id;

  try {
    const audioDoc = await Audio.findOne({ _id: audioId });

    if (!audioDoc) {
      return next(
        new apiError(
          "Audio not found or you are not the owner of this audio",
          404
        )
      );
    }

    const deleteResult = await Audio.deleteOne({ _id: audioId });

    if (deleteResult.deletedCount === 0) {
      return next(new apiError("Failed to delete audio from database", 500));
    }

    const audioPath = path.join(
      "uploads",
      "audios",
      `user_${audioDoc.user}`,
      audioDoc.audioName
    );
    const coverPath = path.join(
      "uploads",
      "covers",
      `user_${audioDoc.user}`,
      audioDoc.coverName
    );

    try {
      await fs.unlink(audioPath);
      console.log(`Audio file deleted: ${audioPath}`);
    } catch (fileErr) {
      console.log(`Audio file not found or already deleted: ${audioPath}`);
    }

    if (
      audioDoc.coverName !== "song_cover.png" &&
      audioDoc.coverName !== "public/images/song_cover.png"
    ) {
      try {
        await fs.unlink(coverPath);
        console.log(`Cover file deleted: ${coverPath}`);
      } catch (fileErr) {
        console.log(`Cover file not found or already deleted: ${coverPath}`);
      }
    } else {
      console.log(`Skipping deletion of default cover: ${audioDoc.coverName}`);
    }

    res.status(200).json({
      message: "Audio and associated files deleted successfully",
    });
  } catch (err) {
    console.error("Delete audio error:", err);
    next(new apiError("Failed to delete audio: " + err.message, 500));
  }
};

module.exports = { deleteAudioAdmin };
