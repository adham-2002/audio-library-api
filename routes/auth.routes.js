const express = require("express");
const { body } = require("express-validator");
const {
  signup,
  signin,
  newAccessToken,
} = require("../controllers/auth.Controller");
const {
  signupValidator,
  loginValidator,
  refreshTokenValidator,
} = require("../utils/validators/authValidator");
const { authLimiter } = require("../middlewares/rateLimiter");
const router = express.Router();

// Apply auth rate limiting ONLY to sensitive auth endpoints
router.post("/signup", authLimiter, signupValidator, signup);
router.post("/signin", authLimiter, loginValidator, signin);
// Token refresh doesn't need rate limiting as much (already validated token)
router.post("/refresh-token", refreshTokenValidator, newAccessToken);

module.exports = router;
