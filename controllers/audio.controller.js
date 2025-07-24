const Audio = require("../models/audio.model");
const User = require("../models/users.model");
const path = require("path");
const fs = require("fs");
const apiError = require("../utils/apiError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const getAudioDuration = require("../utils/getAudioDuration");

// Helper function for single file deletion
const deleteFileIfExists = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
    console.log(`File deleted: ${filePath}`);
    return true;
  } catch (err) {
    console.log(`File not found or already deleted: ${filePath}`);
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
    console.log(`Skipping deletion of default cover: ${coverName}`);
    return false;
  }
};

// Complete audio deletion helper
const helperAudioDeletion = async (audioDoc, userId) => {
  await deleteAudioFile(userId, audioDoc.audioName);
  await deleteCoverFile(userId, audioDoc.coverName);
};
const uploadAudio = asyncErrorHandler(async (req, res, next) => {
  const { title, genre, privacy = "public" } = req.body;
  const userId = req.user.id;
  if (!req.files.audio?.[0].filename) {
    return next(new apiError("You Must Provide Audio", 400));
  }
  const audioFileName = req.files.audio?.[0].filename;
  const audioPath = path.join(
  __dirname, "..", "uploads", "audios", `user_${userId}`, audioFileName
  );
  const duration = await getAudioDuration(audioPath)
  const audioData = {
    title,
    genre,
    privacy,
    user: userId,
    coverName: req.files.cover?.[0].filename,
    audioName: req.files.audio?.[0].filename,
    duration
  };
  const newAudio = await Audio.create(audioData);
  res.status(201).json({
    status: "success",
    message: "Audio uploaded successfully",
    data: {
      audio: {
        id: newAudio._id,
        title: newAudio.title,
        genre: newAudio.genre,
        duration:newAudio.duration,
        privacy: newAudio.privacy,
        coverName: newAudio.coverName,
        audioName: newAudio.audioName,
        user: newAudio.user,
      },
    },
  });
});

const getPublicAudios = asyncErrorHandler(async (req, res, next) => {
  const publicAudios = await Audio.find({ privacy: "public" }).populate(
    "user",
    "username email"
  );
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
  const myAudios = await Audio.find({ user: userId }).populate(
    "user",
    "username"
  );
  console.log(myAudios);
  if (myAudios.length === 0) {
    return next(new apiError("You haven't uploaded any audios", 404));
  }
  res.status(200).json({
    message: "successfully",
    data: {
      audios: myAudios,
    },
  });
});

// const deleteAudio = (role = 'user') => {
//   return asyncErrorHandler(async (req, res, next) => {
//   });
// };

const deleteAudio = asyncErrorHandler(async (req, res, next) => {
  // 1) get the user id from the request object and audio id from the request params
  const userId = req.user.id;
  const audioId = req.params.audioId;
  // 2) find the audio document in the database
  const audioDoc = await Audio.findOne({ user: userId, _id: audioId });
  // 3) handle the case where the audio document is not found
  if (!audioDoc) {
    return next(
      new apiError(
        "Audio not found or you are not the owner of this audio",
        404
      )
    );
  }
  // 4) check if the user is admin or the owner of the audio
  if (req.user.role !== "admin" && audioDoc.user.toString() !== userId) {
    return next(
      new apiError("You are not authorized to delete this audio", 403)
    );
  }
  // 5) delete the audio document from the database
  const deleteResult = await Audio.deleteOne({ user: userId, _id: audioId });

  if (deleteResult.deletedCount === 0) {
    return next(new apiError("Failed to delete audio from database", 500));
  }
  // 6) delete the audio file from the filesystem
  await helperAudioDeletion(audioDoc, userId);

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
  const userId = req.user.id;
  const audioDoc = await Audio.findById(audioId);
  if (!audioDoc) {
    return next(new apiError("Audio not found", 404));
  }

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
  const audioStream = fs.createReadStream(audioPath);
  audioStream.on("error", (err) => {
    console.error("Audio stream error:", err);
    next(new apiError("Failed to stream audio", 500));
  });
  res.setHeader("Content-Type", "audio/mpeg");

  audioStream.pipe(res);
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

const getNewRelease = asyncErrorHandler(async(req,res,next)=>{
  const DAYS = 30;
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  
  const newReleases = await Audio.find({
    createdAt: { $gte: since }
  }).sort({ createdAt: -1 }); 

  res.status(200).json({
    status: "success",
    results: newReleases.length,
    newReleases: newReleases,
  });
})
module.exports = {
  uploadAudio,
  getPublicAudios,
  getUserAudios,
  deleteAudio,
  updateAudio,
  streamAudio,
  getMostPopularAudios,
  getNewRelease
};
