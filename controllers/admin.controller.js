const Audio = require("../models/audio.model");
const path = require("path");
const fs = require("fs").promises;
const apiError = require("../utils/apiError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const ApiFeatures = require("../utils/apiFeatures");

const getAllAudios = asyncErrorHandler(async (req, res, next) => {
  // Count total documents for pagination
  const documentsCount = await Audio.countDocuments();

  // Apply ApiFeatures
  const apiFeatures = new ApiFeatures(Audio.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .search("Audio")
    .paginate(documentsCount);

  const audios = await apiFeatures.mongooseQuery;

  res.status(200).json({
    status: "success",
    message: "All audios fetched successfully",
    results: audios.length,
    pagination: apiFeatures.paginationResult,
    data: {
      audios,
    },
  });
});

module.exports = {
  getAllAudios,
};
