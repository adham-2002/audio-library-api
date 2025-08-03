const authConfig = {
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    error: "Too many authentication attempts",
    message: "Please wait before trying again.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
};

// File upload endpoints (upload audio, covers)
const uploadConfig = {
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 10, // 10 uploads per hour
  message: {
    error: "Upload limit exceeded",
    message: "You can only upload 10 files per hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Critical operations (delete operations)
const criticalConfig = {
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 20, // 20 critical operations per hour
  message: {
    error: "Critical operation limit exceeded",
    message: "Too many sensitive operations. Please try again later.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Admin endpoints
const adminConfig = {
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 50, // 50 admin operations per hour
  message: {
    error: "Admin operation limit exceeded",
    message: "Too many admin operations. Please try again later.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

module.exports = {
  authConfig,
  uploadConfig,
  criticalConfig,
  adminConfig,
};
