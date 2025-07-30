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
const router = express.Router();

router.post("/signup", signupValidator, signup);
router.post("/signin", loginValidator, signin);
router.post("/refresh-token", refreshTokenValidator, newAccessToken);
module.exports = router;
