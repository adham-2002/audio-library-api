const app = require("../app");
const express = require("express");
const upload = require("../config/multer");
const authMiddleware = require("../middlewares/authMiddleware");
const { newAccessToken } = require("../utils/jwt");
const { body } = require("express-validator");
const {
  signup,
  signin,
  profile,
  getHistory,
  addfavorite,
  getFavorites,
  removeFavorite
} = require("../controllers/user.controller");
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

router.get("/profile", authMiddleware(["user", "admin"]),profile);

router.get("/history", authMiddleware(["user", "admin"]), getHistory);
router.get('/favorites',authMiddleware(['user','admin']),getFavorites)
router.post("/add-favorite/:audioId", authMiddleware(["user", "admin"]), addfavorite);
router.delete('/remove-favorite/:audioId', authMiddleware(['user', 'admin']), removeFavorite);

module.exports = router;
