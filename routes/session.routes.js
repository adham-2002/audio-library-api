const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  logout,
  logoutAll,
  getLoggedUserSessions,
  deleteSpecificSession,
} = require("../controllers/session.controller");
const {
  deleteSpecificSessionValidator,
} = require("../utils/validators/sessionValidator");
const router = express.Router();

router.use(authMiddleware(["admin", "user"]));
router.get("/", getLoggedUserSessions);
router.post("/logout", logout);
router.post("/logout-all", logoutAll);
router.delete(
  "/:sessionId",
  deleteSpecificSessionValidator,
  deleteSpecificSession
);

module.exports = router;
