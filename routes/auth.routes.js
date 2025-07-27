const express = require("express");
const { body } = require("express-validator");
const {
  signup,
  signin,
  newAccessToken,
  logout,
  logoutAll,
} = require("../controllers/auth.Controller");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post(
  "/signup",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  signup
);
router.post(
  "/signin",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  signin
);
router.post("/refresh-token", newAccessToken);
router.post("/logout", authMiddleware(["user", "admin"]), logout);
router.post("/logout-all", authMiddleware(["user", "admin"]), logoutAll);

module.exports = router;
