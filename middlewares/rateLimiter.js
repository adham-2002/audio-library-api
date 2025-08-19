const rateLimit = require("express-rate-limit");
const {
  authConfig,
  uploadConfig,
  criticalConfig,
  adminConfig,
} = require("../config/rateLimiterConfig");

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
