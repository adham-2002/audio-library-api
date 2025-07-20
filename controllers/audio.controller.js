// - `POST /api/audio` — upload audio file (MP3/M4A), cover image, title, genre, and private/public setting
// - `GET /api/audio` — list public audio files from all users
// - `GET /api/audio/mine` — list your own uploaded files (public + private)
// DELETE /api/audio/:id — delete your own audio file

const Audio = require("../models/audio.model");
const path = require("path");
const fs = require("fs");
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
  console.log(req.files.cover?.[0].filename);
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
    const audioDoc = await Audio.findOne({ user: userId, _id: audioId });

    if (!audioDoc) {
      return next(
        new Error("Audio not found or you are not the owner of this audio")
      );
    }

    const deleteResult = await Audio.deleteOne({ user: userId, _id: audioId });

    if (deleteResult.deletedCount === 0) {
      return next(new Error("Failed to delete audio from database"));
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
    next(new Error("Failed to delete audio: " + err.message));
  }
};
const updateAudio = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new Error("User not authenticated"));
  }
  const userId = req.user.id;
  const audioId = req.params.id;
  const { title, genre, isPublic } = req.body;
  const isPublicBool = isPublic === "true" || isPublic === true;

  try {
    const audioDoc = await Audio.findOneAndUpdate(
      { user: userId, _id: audioId },
      {
        $set: {
          title,
          genre,
          privacy: isPublicBool ? "public" : "private",
        },
      },
      { new: true }
    );
    if (!audioDoc) {
      return next(
        new Error("Audio not found or you are not the owner of this audio")
      );
    }
    res.json({ message: "Audio updated successfully", audio: audioDoc });
  } catch (err) {
    next(err);
  }
};

const streamAudio = async (req, res, next) => {
  const { audioId } = req.params;
  const audioDoc = await Audio.findById(audioId);
  if (!audioDoc) {
    return next(new Error("Audio not found"));
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
    next(new Error("Failed to stream audio"));
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
