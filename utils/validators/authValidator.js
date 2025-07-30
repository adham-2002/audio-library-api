const { body, cookie } = require("express-validator");
const validationResult = require("../../middlewares/validatorMiddleware");
const passwordValidator = require("../../utils/passwordValidator");

exports.loginValidator = [
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .trim()
    .escape(),
  validationResult,
];

exports.signupValidator = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .trim()
    .escape(),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .trim()
    .escape()
    .custom((value) => {
      if (!passwordValidator(value)) {
        return false;
      }
      return true;
    }),
  validationResult,
];

exports.refreshTokenValidator = [
  cookie("refresh_token")
    .notEmpty()
    .withMessage("Refresh token is required")
    .isJWT()
    .withMessage("Invalid refresh token format"),
  validationResult,
];
