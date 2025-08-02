const User = require("../models/users.model");
const Audio = require("../models/audio.model");

const apiError = require("../utils/apiError");
const logger = require("../utils/logger");
const ApiFeatures = require("../utils/apiFeatures");

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

  const user = await User.findById(userId).select("history");
  if (!user) {
    return next(new apiError("User not found", 404));
  }

  // Get history audio IDs
  const historyIds = user.history;

  if (historyIds.length === 0) {
    return res.status(200).json({
      status: "success",
      message: "No history found",
      results: 0,
      pagination: {},
      data: { history: [] },
    });
  }

  // Count total documents for pagination
  const documentsCount = historyIds.length;

  // Apply ApiFeatures to Audio model using history IDs
  const apiFeatures = new ApiFeatures(
    Audio.find({ _id: { $in: historyIds } }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .search("Audio")
    .paginate(documentsCount);

  const history = await apiFeatures.mongooseQuery;

  res.status(200).json({
    status: "success",
    message: "History fetched successfully",
    results: history.length,
    pagination: apiFeatures.paginationResult,
    data: { history },
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

  const user = await User.findById(userId).select("favorites");
  if (!user) {
    return next(new apiError("User not found", 404));
  }

  // Get favorites audio IDs
  const favoriteIds = user.favorites;

  if (favoriteIds.length === 0) {
    return res.status(200).json({
      status: "success",
      message: "No favorites found",
      results: 0,
      pagination: {},
      data: { favorites: [] },
    });
  }

  // Count total documents for pagination
  const documentsCount = favoriteIds.length;

  // Apply ApiFeatures to Audio model using favorite IDs
  const apiFeatures = new ApiFeatures(
    Audio.find({ _id: { $in: favoriteIds } }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .search("Audio")
    .paginate(documentsCount);

  const favorites = await apiFeatures.mongooseQuery;

  res.status(200).json({
    status: "success",
    message: "Favorites fetched successfully",
    results: favorites.length,
    pagination: apiFeatures.paginationResult,
    data: { favorites },
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
