const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  profile,
  getHistory,
  addfavorite,
  getFavorites,
  removeFavorite,
} = require("../controllers/user.controller");
const { audioIdValidator } = require("../utils/validators/audioValidator");
const router = express.Router();

router.get("/profile", authMiddleware(["user", "admin"]), profile);

router.get("/history", authMiddleware(["user", "admin"]), getHistory);
router.get("/favorites", authMiddleware(["user", "admin"]), getFavorites);
router.post(
  "/add-favorite/:audioId",
  authMiddleware(["user", "admin"]),
  audioIdValidator,
  addfavorite
);
router.delete(
  "/remove-favorite/:audioId",
  authMiddleware(["user", "admin"]),
  audioIdValidator,
  removeFavorite
);

module.exports = router;
