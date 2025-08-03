const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getAllAudios } = require("../controllers/admin.controller");
const { adminLimiter } = require("../middlewares/rateLimiter");
const router = express.Router();

// Admin endpoints (rate limit admin operations to prevent abuse)
router.get(
  "/admin/audios",
  adminLimiter,
  authMiddleware("admin"),
  getAllAudios
);

module.exports = router;
