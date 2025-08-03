const rateLimit = require("express-rate-limit");
const {
  authConfig,
  uploadConfig,
  criticalConfig,
  adminConfig,
} = require("../config/rateLimiterConfig");

// Create rate limiter instances (only the ones we actually use)
const authLimiter = rateLimit(authConfig);
const uploadLimiter = rateLimit(uploadConfig);
const criticalLimiter = rateLimit(criticalConfig);
const adminLimiter = rateLimit(adminConfig);

module.exports = {
  authLimiter,
  uploadLimiter,
  criticalLimiter,
  adminLimiter,
};
