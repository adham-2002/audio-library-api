const Audio = require("../models/audio.model");
const path = require("path");
const fs = require("fs");
const apiError = require("../utils/apiError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const logger = require("../utils/logger");

// Helper function for single file deletion
const deleteFileIfExists = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
    logger.info(`File deleted successfully: ${filePath}`);
    return true;
  } catch (err) {
    logger.warn(`File deletion failed: ${filePath} - ${err.message}`);
    return false;
  }
};

// Helper function for audio file deletion
const deleteAudioFile = async (userId, audioName) => {
  const audioPath = path.join("uploads", "audios", `user_${userId}`, audioName);
  return await deleteFileIfExists(audioPath);
};

// Helper function for cover file deletion (checks if it's not a default cover)
const deleteCoverFile = async (userId, coverName) => {
  if (
    coverName !== "song_cover.png" &&
    coverName !== "public/images/song_cover.png" &&
    coverName !== "public/images/song_cover.jpg"
  ) {
    const coverPath = path.join(
      "uploads",
      "covers",
      `user_${userId}`,
      coverName
    );
    return await deleteFileIfExists(coverPath);
  } else {
    logger.info(`Skipping deletion of default cover: ${coverName}`);
    return false;
  }
};

// Complete audio deletion helper
const helperAudioDeletion = async (audioDoc, userId) => {
  await deleteAudioFile(userId, audioDoc.audioName);
  await deleteCoverFile(userId, audioDoc.coverName);
};
const uploadAudio = asyncErrorHandler(async (req, res, next) => {
  //1) get the title, genre, privacy from the request body and user id from the request object(authMiddleware)
  const { title, genre, privacy = "public" } = req.body;
  const userId = req.user.id;

  logger.info(`Audio upload attempt by user ${userId}`, {
    title,
    genre,
    privacy,
    hasAudio: !!req.files.audio?.[0],
    hasCover: !!req.files.cover?.[0],
  });

  //2) validate if audio sent as it is required
  if (!req.files.audio?.[0].filename) {
    logger.warn(
      `Audio upload failed - no audio file provided by user ${userId}`
    );
    return next(new apiError("You Must Provide Audio", 400));
  }
  //3) prepare the audio data to be saved in the database
  const audioData = {
    title,
    genre,
    privacy,
    user: userId,
    coverName: req.files.cover?.[0].filename,
    audioName: req.files.audio?.[0].filename,
  };
  //4) create the audio document in the database
  const newAudio = await Audio.create(audioData);

  logger.info(`Audio uploaded successfully`, {
    audioId: newAudio._id,
    title: newAudio.title,
    userId,
    audioName: newAudio.audioName,
    coverName: newAudio.coverName,
  });

  //5) return the response with the new audio data
  res.status(201).json({
    status: "success",
    message: "Audio uploaded successfully",
    data: {
      audio: {
        id: newAudio._id,
        title: newAudio.title,
        genre: newAudio.genre,
        privacy: newAudio.privacy,
        coverName: newAudio.coverName,
        audioName: newAudio.audioName,
        user: newAudio.user,
      },
    },
  });
});

const getPublicAudios = asyncErrorHandler(async (req, res, next) => {
  logger.info("Fetching public audios");
  const publicAudios = await Audio.find({ privacy: "public" }).populate(
    "user",
    "username email"
  );

  logger.info(`Retrieved ${publicAudios.length} public audios`);
  res.status(200).json({
    status: "success",
    message: "Public audios fetched successfully",
    data: {
      audios: publicAudios,
    },
  });
});
const getUserAudios = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  logger.info(`Fetching audios for user ${userId}`);

  const myAudios = await Audio.find({ user: userId }).populate(
    "user",
    "username"
  );

  if (myAudios.length === 0) {
    logger.info(`No audios found for user ${userId}`);
    return next(new apiError("You haven't uploaded any audios", 404));
  }

  logger.info(`Retrieved ${myAudios.length} audios for user ${userId}`);
  res.status(200).json({
    message: "successfully",
    data: {
      audios: myAudios,
    },
  });
});

const deleteAudio = asyncErrorHandler(async (req, res, next) => {
  // 1) get the user id from the request object and audio id from the request params
  const userId = req.user.id;
  const audioId = req.params.audioId;

  logger.info(`Delete audio attempt`, {
    userId,
    audioId,
    userRole: req.user.role,
  });

  // 2) find the audio document in the database
  const audioDoc = await Audio.findOne({ user: userId, _id: audioId });
  // 3) handle the case where the audio document is not found
  if (!audioDoc) {
    logger.warn(`Audio deletion failed - audio not found or unauthorized`, {
      userId,
      audioId,
    });
    return next(
      new apiError(
        "Audio not found or you are not the owner of this audio",
        404
      )
    );
  }
  // 4) check if the user is admin or the owner of the audio
  if (req.user.role !== "admin" && audioDoc.user.toString() !== userId) {
    logger.warn(`Audio deletion failed - unauthorized access`, {
      userId,
      audioId,
      ownerId: audioDoc.user.toString(),
      userRole: req.user.role,
    });
    return next(
      new apiError("You are not authorized to delete this audio", 403)
    );
  }
  // 5) delete the audio document from the database
  const deleteResult = await Audio.deleteOne({ user: userId, _id: audioId });

  if (deleteResult.deletedCount === 0) {
    logger.error(`Failed to delete audio from database`, {
      userId,
      audioId,
      deleteResult,
    });
    return next(new apiError("Failed to delete audio from database", 500));
  }
  // 6) delete the audio file from the filesystem
  await helperAudioDeletion(audioDoc, userId);

  logger.info(`Audio deleted successfully`, {
    audioId,
    userId,
    title: audioDoc.title,
    audioName: audioDoc.audioName,
    coverName: audioDoc.coverName,
  });

  res.status(200).json({
    message: "Audio and associated files deleted successfully",
  });
});

const updateAudio = asyncErrorHandler(async (req, res, next) => {
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
    // Delete old cover using helper
    await deleteCoverFile(userId, wantedAudio.coverName);
    wantedAudio.coverName = req.files.cover[0].filename;
  }

  // Update audio if provided
  if (req.files?.audio?.[0]) {
    // Delete old audio using helper
    await deleteAudioFile(userId, wantedAudio.audioName);
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
});

const streamAudio = asyncErrorHandler(async (req, res, next) => {
  const { audioId } = req.params;
  const userRole = req.user.role;
  logger.info(`Audio stream request`, { audioId });

  const audioDoc = await Audio.findById(audioId);
  //1) check if the user own the audio or is he an admin
  if (userRole !== "admin" && audioDoc.user.toString() !== req.user.id) {
    logger.warn(`Unauthorized audio stream attempt`, {
      audioId,
      userId: req.user.id,
      userRole,
    });
    return next(
      new apiError("You are not authorized to stream this audio", 403)
    );
  }
  if (!audioDoc) {
    logger.error(`Audio not found for streaming`, { audioId });
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

  logger.info(`Streaming audio`, {
    audioId,
    title: audioDoc.title,
    audioPath,
    userId: audioDoc.user,
  });

  const audioStream = fs.createReadStream(audioPath);
  audioStream.on("error", (err) => {
    logger.error("Audio stream error:", {
      audioId,
      audioPath,
      error: err.message,
      stack: err.stack,
    });
    next(new apiError("Failed to stream audio", 500));
  });
  res.setHeader("Content-Type", "audio/mpeg");

  audioStream.pipe(res);
});
module.exports = {
  uploadAudio,
  getPublicAudios,
  getUserAudios,
  deleteAudio,
  updateAudio,
  streamAudio,
};
