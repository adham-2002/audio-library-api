const { param } = require("express-validator");
const validationResult = require("../../middlewares/validatorMiddleware");

exports.deleteSpecificSessionValidator = [
  param("sessionId").isUUID().withMessage("Invalid session ID format"),
  validationResult,
];
