const app = require("../app");
const express = require("express");
const { signup, signin } = require("../controllers/user.controller");

const authMiddleware = require('../middlewares/authMiddleware')
const { newAccessToken } = require("../utils/jwt");
const { body} = require("express-validator");

const router = express.Router();

router.post(
  "/signup",[body("username").notEmpty().withMessage("Username is required"),body("email").isEmail().withMessage("Valid email is required"),body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),],
  signup
);
router.post(
  "/signin",[body("email").isEmail().withMessage("Valid email is required"),body("password").notEmpty().withMessage("Password is required"),],
  signin
);
router.post("/refresh-token", newAccessToken);

router.get('/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;