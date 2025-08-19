const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getLoggedUser,
  updateLoggedInUserPassword,
  updateLoggedUserData,
  getHistory,
  addfavorite,
  getFavorites,
  removeFavorite,
  getAllUsers,
  getUserById,
  userDeactivate,
} = require("../controllers/user.controller");
const { audioIdValidator } = require("../utils/validators/audioValidator");
const router = express.Router();
//! get all users
router.get("/", authMiddleware(["user", "admin"]), getAllUsers);
router.get("/getme", authMiddleware(["user"]), getLoggedUser);
//! get specific user by id
router.get("/:id", authMiddleware(["user", "admin"]), getUserById);
//! deactivate user alternative for deletion
router.put(
  "/:id/deactivate",
  authMiddleware(["admin", "user"]),
  userDeactivate
);
//! update logged in user password
router.put(
  "/change-my-password",
  authMiddleware(["user"]),
  updateLoggedInUserPassword
);
router.put("/update-me", authMiddleware(["user"]), updateLoggedUserData);

// User profile and data endpoints (no rate limiting - user's own data)
router.get("/history", authMiddleware(["user", "admin"]), getHistory);
router.get("/favorites", authMiddleware(["user", "admin"]), getFavorites);

// User actions (no rate limiting - simple operations)
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
