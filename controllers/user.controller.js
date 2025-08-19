const User = require("../models/users.model");
const Audio = require("../models/audio.model");

const apiError = require("../utils/apiError");
const logger = require("../utils/logger");
const ApiFeatures = require("../utils/apiFeatures");
const bcrypt = require("bcrypt");

const asyncErrorHandler = require("../utils/asyncErrorHandler");
// @desc Get all users
// @route GET /api/v1/users
// @access Private
const getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const countDocuments = await User.countDocuments();

  // Always exclude sensitive fields like password
  const apiFeatures = new ApiFeatures(
    User.find().select("username email profilePic createdAt"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .search("User")
    .paginate(countDocuments);

  const users = await apiFeatures.mongooseQuery;

  res.status(200).json({
    status: "success",
    message: "All users fetched successfully",
    results: users.length,
    pagination: apiFeatures.paginationResult,
    data: {
      users,
    },
  });
});
// @desc Get user by ID
// @route GET /api/v1/users/:id
// @access Private
const getUserById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id).select(
    "username email profilePic createdAt"
  );
  if (!user) {
    return next(new apiError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "User fetched successfully",
    data: {
      user,
    },
  });
});
// @desc Deactivate a user account
// @route PUT /api/v1/users/:id/deactivate
// @access Private
const userDeactivate = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  if (requesterRole !== "admin" && requesterId !== id) {
    return next(
      new apiError("you are not authorized to deactivate this user", 403)
    );
  }
  await User.findByIdAndUpdate(id, {
    isActive: false,
    deactivatedAt: Date.now(),
  });
  res.status(200).json({
    status: "success",
    message: "User deactivated successfully",
  });
});
// @desc Get Logged User
// @route GET /api/v1/users/getMe
// @access Private
const getLoggedUser = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select(
    "username email profilePic createdAt"
  );
  if (!user) {
    return next(new apiError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Logged user fetched successfully",
    data: {
      user,
    },
  });
});
// @desc Update Logged In User Password
// @route PUT /api/v1/users/change-my-password
// @access Private
const updateLoggedInUserPassword = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(userId);
  // 1) check if currentPassword == Real Password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return next(new apiError("Current password is incorrect", 401));
  }

  //2) hash password before save
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});
// @desc Update Logged User Data
// @route PUT /api/v1/users/update-me
// @access Private
const updateLoggedUserData = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new apiError("User not found", 404));
  }

  if (username !== undefined) user.username = username;
  if (email !== undefined) user.email = email;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "User data updated successfully",
  });
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
  getLoggedUser,
  updateLoggedInUserPassword,
  updateLoggedUserData,
  getHistory,
  addfavorite,
  getFavorites,
  removeFavorite,
  getAllUsers,
  getUserById,
  userDeactivate,
};
