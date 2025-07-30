const { body, param } = require("express-validator");
const validationResult = require("../../middlewares/validatorMiddleware");
const passwordValidator = require("../../utils/passwordValidator");

exports.updateProfileValidator = [
  body("username")
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens")
    .trim()
    .escape(),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("currentPassword")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Current password must be at least 6 characters long"),
  body("newPassword")
    .optional()
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .custom((value, { req }) => {
      if (value && !req.body.currentPassword) {
        throw new Error("Current password is required when changing password");
      }
      if (value && !passwordValidator(value)) {
        throw new Error(
          "New password must contain uppercase, lowercase, number, special character and be at least 6 characters long"
        );
      }
      return true;
    }),
  body("confirmPassword")
    .optional()
    .custom((value, { req }) => {
      if (req.body.newPassword && value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match new password");
      }
      return true;
    }),
  validationResult,
];

exports.userIdValidator = [
  param("userId")
    .isMongoId()
    .withMessage("Invalid user ID format"),
  validationResult,
];
