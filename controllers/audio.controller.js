// - `POST /api/audio` — upload audio file (MP3/M4A), cover image, title, genre, and private/public setting
// - `GET /api/audio` — list public audio files from all users
// - `GET /api/audio/mine` — list your own uploaded files (public + private)
// DELETE /api/audio/:id — delete your own audio file

const Audio = require("../models/audio.model");
const path = require("path");
const fs = require("fs");
const apiError = require("../utils/apiError");
// async function deleteFile(path) {
//   try {
//     await fs.unlink(path);
//   } catch (err) {
//     console.error("Error deleting file:", err);
//   }
// }
const uploadAudio = async (req, res, next) => {
  const { title, genre, privacy = "public" } = req.body;
  const userId = req.user.id;
  if (!req.files.audio?.[0].filename) {
    return next(new apiError("You Must Provide Audio", 400));
  }
  const audioData = {
    title,
    genre,
    privacy,
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
    return next(new apiError("You haven't uploaded any audios", 404));
  }
  res.status(200).json({
    message: "successfully",
    myAudios,
  });
};
const deleteAudio = async (req, res, next) => {
  const userId = req.user.id;
  const audioId = req.params.audioId; // Changed from req.params.id to req.params.audioId

  try {
    const audioDoc = await Audio.findOne({ user: userId, _id: audioId });

    if (!audioDoc) {
      return next(
        new apiError(
          "Audio not found or you are not the owner of this audio",
          404
        )
      );
    }

    const deleteResult = await Audio.deleteOne({ user: userId, _id: audioId });

    if (deleteResult.deletedCount === 0) {
      return next(new apiError("Failed to delete audio from database", 500));
    }

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

    try {
      await fs.unlink(audioPath);
      console.log(`Audio file deleted: ${audioPath}`);
    } catch (fileErr) {
      console.log(`Audio file not found or already deleted: ${audioPath}`);
    }

    if (
      audioDoc.coverName !== "song_cover.png" &&
      audioDoc.coverName !== "public/images/song_cover.png" &&
      audioDoc.coverName !== "public/images/song_cover.jpg"
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
const updateAudio = async (req, res, next) => {
  try {
    const { title, genre, privacy = "public" } = req.body;
    const { audioId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const wantedAudio = await Audio.findOne({ user: userId, _id: audioId });
    if (!wantedAudio) {
      return next(
        new apiError(
          "Audio not found or you are not the owner of this audio",
          404
        )
      );
    }
    if (userRole !== "admin" && wantedAudio.user.toString() !== userId) {
      return next(
        new apiError("You are not authorized to update this audio", 403)
      );
    }

    // Update cover if provided
    if (req.files?.cover?.[0]) {
      // Delete old cover if it's not a default one
      if (
        wantedAudio.coverName !== "song_cover.png" &&
        wantedAudio.coverName !== "public/images/song_cover.png" &&
        wantedAudio.coverName !== "public/images/song_cover.jpg"
      ) {
        const oldCoverPath = path.join(
          "uploads",
          "covers",
          `user_${userId}`,
          wantedAudio.coverName
        );
        try {
          await fs.promises.unlink(oldCoverPath);
          console.log(`Old cover deleted: ${oldCoverPath}`);
        } catch (err) {
          console.log(`Could not delete old cover: ${err.message}`);
        }
      }
      wantedAudio.coverName = req.files.cover[0].filename;
    }

    // Update audio if provided
    if (req.files?.audio?.[0]) {
      const oldAudioPath = path.join(
        "uploads",
        "audios",
        `user_${userId}`,
        wantedAudio.audioName
      );
      try {
        await fs.promises.unlink(oldAudioPath);
        console.log(`Old audio deleted: ${oldAudioPath}`);
      } catch (err) {
        console.log(`Could not delete old audio: ${err.message}`);
      }
      wantedAudio.audioName = req.files.audio[0].filename;
    }

    // Update other fields
    if (title) wantedAudio.title = title;
    if (genre) wantedAudio.genre = genre;
    if (privacy) wantedAudio.privacy = privacy;

    await wantedAudio.save();
    res.status(200).json({
      message: "Audio updated successfully",
      audio: wantedAudio,
    });
  } catch (error) {
    next(error);
  }
};

const streamAudio = async (req, res, next) => {
  const { audioId } = req.params;
  const audioDoc = await Audio.findById(audioId);
  if (!audioDoc) {
    return next(new apiError("Audio not found", 404));
  }
  // use path.resolve to get the absolute path so it not depend on the current working directory or file in which the code is running
  const audioPath = path.resolve(
    __dirname,
    "..",
    "uploads",
    "audios",
    `user_${audioDoc.user}`,
    audioDoc.audioName
  );
  const audioStream = fs.createReadStream(audioPath);
  audioStream.on("error", (err) => {
    console.error("Audio stream error:", err);
    next(new apiError("Failed to stream audio", 500));
  });
  res.setHeader("Content-Type", "audio/mpeg");

  audioStream.pipe(res);
};
module.exports = {
  uploadAudio,
  getPublicAudios,
  getUserAudios,
  deleteAudio,
  updateAudio,
  streamAudio,
};
