const { validationResult } = require("express-validator");
const apiError = require("../utils/apiError");

const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Create a formatted error message from all validation errors
    const errorMessages = errors.array().map((err) => err.msg);
    const combinedMessage = errorMessages.join(", ");

    // Throw apiError to let global error handler format the response
    return next(new apiError(combinedMessage, 400));
  }
  next();
};

module.exports = validatorMiddleware;
