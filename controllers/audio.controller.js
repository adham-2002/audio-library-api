const Audio = require("../models/audio.model");
const User = require("../models/users.model");
const path = require("path");
const fs = require("fs");
const apiError = require("../utils/apiError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const ApiFeatures = require("../utils/apiFeatures");

const getAudioDuration = require("../utils/getAudioDuration");

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
    coverName !== "images/song_cover.jpg"
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

/**
 * @desc create a new Audio
 * @route POST /audios/
 * @access Private (user)
 */

const uploadAudio = asyncErrorHandler(async (req, res, next) => {
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
  const audioFileName = req.files.audio?.[0].filename;
  const audioPath = path.join(
    __dirname,
    "..",
    "uploads",
    "audios",
    `user_${userId}`,
    audioFileName
  );
  const duration = await getAudioDuration(audioPath);
  const audioData = {
    title,
    genre,
    privacy,
    user: userId,
    coverName: req.files.cover?.[0].filename,
    audioName: req.files.audio?.[0].filename,
    duration,
  };
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
        duration: newAudio.duration,
        privacy: newAudio.privacy,
        coverName: newAudio.coverName,
        audioName: newAudio.audioName,
        user: newAudio.user,
      },
    },
  });
});
/**
 * @desc Get all public audios
 * @route GET /audios/
 * @access Public
 */
const getPublicAudios = asyncErrorHandler(async (req, res, next) => {
  logger.info("Fetching public audios with query parameters", req.query);

  // Count total documents for pagination
  const documentsCount = await Audio.countDocuments({ privacy: "public" });

  // Apply ApiFeatures
  const apiFeatures = new ApiFeatures(
    Audio.find({ privacy: "public" }).populate("user", "username email"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .search("Audio")
    .paginate(documentsCount);

  const publicAudios = await apiFeatures.mongooseQuery;

  logger.info(
    `Retrieved ${publicAudios.length} public audios out of ${documentsCount} total`
  );

  res.status(200).json({
    status: "success",
    message: "Public audios fetched successfully",
    results: publicAudios.length,
    pagination: apiFeatures.paginationResult,
    data: {
      audios: publicAudios,
    },
  });
});
/**
 * @desc Get all audios of the authenticated user
 * @route GET /audios/me
 * @access Private (user, admin)
 */
const getUserAudios = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  logger.info(
    `Fetching audios for user ${userId} with query parameters`,
    req.query
  );

  // Count total documents for pagination
  const documentsCount = await Audio.countDocuments({ user: userId });

  // Apply ApiFeatures
  const apiFeatures = new ApiFeatures(
    Audio.find({ user: userId }).populate("user", "username"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .search("Audio")
    .paginate(documentsCount);

  const myAudios = await apiFeatures.mongooseQuery;

  logger.info(
    `Retrieved ${myAudios.length} audios for user ${userId} out of ${documentsCount} total`
  );

  res.status(200).json({
    status: "success",
    message: "User audios fetched successfully",
    results: myAudios.length,
    pagination: apiFeatures.paginationResult,
    data: {
      audios: myAudios,
    },
  });
});
/**
 * @desc Delete audio
 * @route DELETE /audio/:audioId
 * @access Private (user, admin)
 */
const deleteAudio = asyncErrorHandler(async (req, res, next) => {
  // 1) get the user id from the request object and audio id from the request params
  const userId = req.user.id;
  const audioId = req.params.audioId;

  logger.info(`Delete audio attempt`, {
    userId,
    audioId,
    userRole: req.user.role,
  });

  // 2) Audio is already verified by checkAudioOwnership middleware
  const audioDoc = req.audio;

  // 3) delete the audio document from the database
  const deleteResult = await Audio.deleteOne({ _id: audioId });

  if (deleteResult.deletedCount === 0) {
    logger.error(`Failed to delete audio from database`, {
      userId,
      audioId,
      deleteResult,
    });
    return next(new apiError("Failed to delete audio from database", 500));
  }
  // 4) delete the audio file from the filesystem
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
/**
 * @desc Update audio
 * @route PUT /audios/:audioId
 * @access Private (user, admin)
 */
const updateAudio = asyncErrorHandler(async (req, res, next) => {
  const { title, genre, privacy = "public" } = req.body;

  // Audio ownership is already verified by checkAudioOwnership middleware
  const audioDoc = req.audio;
  const audioOwnerId = audioDoc.user.toString();

  logger.info(`Audio update attempt`, {
    audioId: audioDoc._id,
    userId: req.user.id,
    hasNewCover: !!req.files?.cover?.[0],
    hasNewAudio: !!req.files?.audio?.[0],
  });

  // Store old file names for cleanup
  const oldCoverName = audioDoc.coverName;
  const oldAudioName = audioDoc.audioName;

  // Update cover if provided
  if (req.files?.cover?.[0]) {
    const newCoverFile = req.files.cover[0];
    audioDoc.coverName = newCoverFile.filename;

    // Delete old cover file (if not default)
    await deleteCoverFile(audioOwnerId, oldCoverName);
  }

  // Update audio file if provided
  if (req.files?.audio?.[0]) {
    const newAudioFile = req.files.audio[0];
    audioDoc.audioName = newAudioFile.filename;

    // Calculate new duration using the uploaded file path
    audioDoc.duration = await getAudioDuration(newAudioFile.path);

    logger.info(`Calculating duration for audio file`, {
      filename: newAudioFile.filename,
      path: newAudioFile.path,
      calculatedDuration: audioDoc.duration,
    });

    // Delete old audio file
    await deleteAudioFile(audioOwnerId, oldAudioName);
  }

  // Update text fields
  if (title) audioDoc.title = title;
  if (genre) audioDoc.genre = genre;
  if (privacy) audioDoc.privacy = privacy;

  // Save changes
  await audioDoc.save();

  logger.info(`Audio updated successfully`, {
    audioId: audioDoc._id,
    title: audioDoc.title,
    audioName: audioDoc.audioName,
    coverName: audioDoc.coverName,
  });

  res.status(200).json({
    status: "success",
    message: "Audio updated successfully",
    data: {
      audio: audioDoc,
    },
  });
});
/**
 * @desc Stream audio
 * @route GET /audios/stream/:audioId
 * @access Private (user, admin)
 */
const streamAudio = asyncErrorHandler(async (req, res, next) => {
  const { audioId } = req.params;
  const userId = req.user.id;

  logger.info(`Audio stream request`, { audioId });

  // Audio ownership is already verified by checkAudioOwnership middleware
  const audioDoc = req.audio;

  //add listener
  await Audio.updateOne(
    { _id: audioId, audioListeners: { $ne: userId } },
    {
      $addToSet: { audioListeners: userId },
      $inc: { listenersCount: 1 },
    }
  );
  //add to history
  await User.updateOne(
    { _id: userId },
    {
      $push: {
        history: {
          $each: [audioId],
          $slice: -100,
        },
      },
    }
  );

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
/**
 * @desc get specific audio by id
 * @route GET /audios/:audioId
 * @access Private (user, admin)
 */
const getSpecificAudio = asyncErrorHandler(async (req, res, next) => {
  const { audioId } = req.params;

  const audioDoc = await Audio.findById(audioId).populate("user", "username");
  if (!audioDoc) {
    return next(new apiError("Audio not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      audio: audioDoc,
    },
  });
});

const getMostPopularAudios = asyncErrorHandler(async (req, res, next) => {
  const limit = 10;

  const audios = await Audio.find({ privacy: "public" })
    .sort({ listenersCount: -1 })
    .limit(limit)
    .populate("user", "username");

  res.status(200).json({
    status: "success",
    message: "Most popular audios fetched successfully",
    data: {
      audios,
    },
  });
});

const getNewRelease = asyncErrorHandler(async (req, res, next) => {
  const DAYS = 30;
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  const newReleases = await Audio.find({
    createdAt: { $gte: since },
  }).sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: newReleases.length,
    newReleases: newReleases,
  });
});
module.exports = {
  uploadAudio,
  getPublicAudios,
  getUserAudios,
  deleteAudio,
  updateAudio,
  streamAudio,
  getMostPopularAudios,
  getNewRelease,
  getSpecificAudio,
};
