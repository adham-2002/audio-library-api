// - `POST /api/audio` — upload audio file (MP3/M4A), cover image, title, genre, and private/public setting
// - `GET /api/audio` — list public audio files from all users
// - `GET /api/audio/mine` — list your own uploaded files (public + private)
// DELETE /api/audio/:id — delete your own audio file

const Audio = require("../models/audio.model");
const path = require("path");
const fs = require("fs").promises;
// async function deleteFile(path) {
//   try {
//     await fs.unlink(path);
//   } catch (err) {
//     console.error("Error deleting file:", err);
//   }
// }
const uploadAudio = async (req, res, next) => {
  const { title, genre, isPublic } = req.body;
  const userId = req.user.id;
  // save audio in the database
  console.log(req.files.cover?.[0].filename);
  const audioData = {
    title,
    genre,
    privacy: isPublic ? "public" : "private",
    user: userId,
    coverName: req.files.cover?.[0].filename,
    audioName: req.files.audio?.[0].filename,
  };
  try {
    const newAudio = await Audio.create(audioData);
    res.status(201).json(newAudio);
  } catch (error) {
    next(error);
  }
};

const getPublicAudios = async (req, res, next) => {
  const publicAudios = await Audio.find({ privacy: "public" });
  res.status(200).json({
    publicAudios,
  });
};
const getUserAudios = async (req, res, next) => {
  const userId = req.user.id;
  const myAudios = await Audio.find({ user: userId }).populate("user");
  console.log(myAudios);
  if (myAudios.length === 0) {
    return next(new Error("You don't uploaded any audios"));
  }
  res.status(200).json({
    message: "successfully",
    myAudios,
  });
};
const deleteAudio = async (req, res, next) => {
  const userId = req.user.id;
  const audioId = req.params.id;

  try {
    // First, find the audio document to get file names
    const audioDoc = await Audio.findOne({ user: userId, _id: audioId });

    if (!audioDoc) {
      return next(
        new Error("Audio not found or you are not the owner of this audio")
      );
    }

    // Delete the audio document from database
    const deleteResult = await Audio.deleteOne({ user: userId, _id: audioId });

    if (deleteResult.deletedCount === 0) {
      return next(new Error("Failed to delete audio from database"));
    }

    // Delete associated files
    const audioPath = path.join(
      "uploads",
      "audios",
      `user_${userId}`,
      audioDoc.audioName
    );
    const coverPath = path.join(
      "uploads",
      "covers",
      `user_${userId}`,
      audioDoc.coverName
    );

    // Delete audio file
    try {
      await fs.unlink(audioPath);
      console.log(`Audio file deleted: ${audioPath}`);
    } catch (fileErr) {
      console.log(`Audio file not found or already deleted: ${audioPath}`);
    }

    // Delete cover file (only if it's not the default cover)
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
    next(new Error("Failed to delete audio: " + err.message));
  }
};
module.exports = {
  uploadAudio,
  getPublicAudios,
  getUserAudios,
  deleteAudio,
};
