const User = require("../models/users.model");
const Audio = require("../models/audio.model");

const apiError = require("../utils/apiError");
const logger = require("../utils/logger");

const asyncErrorHandler = require("../utils/asyncErrorHandler");
const profile = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;

  const existedUser = await User.findById(userId);
  if (!existedUser) {
    return next(new apiError("User not found", 404));
  }
  res.json({ userProfile: existedUser });
});
const getHistory = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId)
    .select("history")
    .populate("history");

  if (!user) {
    return next(new apiError("User not found", 404));
  }

  const history = user.history;

  res.status(200).json({
    success: true,
    history,
  });
});
const addfavorite = asyncErrorHandler(async (req, res, next) => {
  const { audioId } = req.params;
  const userId = req.user.id;
  if (!audioId) {
    return next(new apiError("Audio ID is required", 404));
  }

  const audioExists = await Audio.findById(audioId);
  if (!audioExists) {
    return next(new apiError("Audio not found", 404));
  }

  await User.updateOne({ _id: userId }, { $addToSet: { favorites: audioId } });
  res.status(200).json({
    status: "success",
    message: "Added to favorites",
  });
});
const getFavorites = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId)
    .select("favorites")
    .populate("favorites");

  if (!user) {
    return next(new apiError("User not found", 404));
  }

  const favorites = user.favorites;

  res.status(200).json({
    success: true,
    favorites,
  });
});
const removeFavorite = asyncErrorHandler(async (req, res, next) => {
  const { audioId } = req.params;
  const userId = req.user.id;

  if (!audioId) {
    return next(new apiError("Audio ID is required", 400));
  }

  const audioExists = await Audio.findById(audioId);
  if (!audioExists) {
    return next(new apiError("Audio not found", 404));
  }

  await User.updateOne({ _id: userId }, { $pull: { favorites: audioId } });

  res.status(200).json({
    status: "success",
    message: "Removed from favorites",
  });
});
module.exports = {
  profile,
  getHistory,
  addfavorite,
  getFavorites,
  removeFavorite,
};
