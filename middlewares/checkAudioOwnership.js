const Audio = require("../models/audio.model");
const apiError = require("../utils/apiError");

const checkAudioOwnership = async (req, res, next) => {
  try {
    // Handle different parameter names used in routes
    const audioId = req.params.audioId || req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const audio = await Audio.findById(audioId);
    if (!audio) {
      return next(new apiError("Audio not found", 404));
    }

    // Check ownership for regular users
    if (userRole !== "admin" && audio.user.toString() !== userId) {
      return next(
        new apiError("You do not have permission to access this audio", 403)
      );
    }

    req.audio = audio; // Store audio for controller use
    next();
  } catch (error) {
    return next(
      new apiError("An error occurred while checking audio ownership", 500)
    );
  }
};

module.exports = checkAudioOwnership;
