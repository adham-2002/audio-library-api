const { body, param } = require("express-validator");
const validationResult = require("../../middlewares/validatorMiddleware");

exports.uploadAudioValidator = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Title must be between 2 and 100 characters")
    .trim()
    .escape(),
  body("genre")
    .notEmpty()
    .withMessage("Genre is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Genre must be between 2 and 50 characters")
    .trim()
    .escape(),
  body("privacy")
    .optional()
    .isIn(["public", "private"])
    .withMessage("Privacy must be either 'public' or 'private'"),
  validationResult,
];

exports.updateAudioValidator = [
  param("audioId").isMongoId().withMessage("Invalid audio ID format"),
  body("title")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Title must be between 2 and 100 characters")
    .trim()
    .escape(),
  body("genre")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Genre must be between 2 and 50 characters")
    .trim()
    .escape(),
  body("privacy")
    .optional()
    .isIn(["public", "private"])
    .withMessage("Privacy must be either 'public' or 'private'"),
  validationResult,
];

exports.audioIdValidator = [
  param("audioId").isMongoId().withMessage("Invalid audio ID format"),
  validationResult,
];

exports.deleteAudioValidator = [
  param("audioId").isMongoId().withMessage("Invalid audio ID format"),
  validationResult,
];

exports.streamAudioValidator = [
  param("audioId").isMongoId().withMessage("Invalid audio ID format"),
  validationResult,
];
