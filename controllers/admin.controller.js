const Audio = require("../models/audio.model");
const path = require("path");
const fs = require("fs").promises;
const apiError = require("../utils/apiError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const getAllAudios = asyncErrorHandler(async (req, res, next) => {
  const audios = (await Audio.find()).flat();
  res.status(200).json({
    status: "success",
    results: audios.length,
    data: {
      audios,
    },
  });
});
module.exports = {
  getAllAudios,
};
