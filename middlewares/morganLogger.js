const morgan = require("morgan");
const logger = require("../utils/logger");

// Custom token for user ID
morgan.token("userId", (req) => req.user?.id || "anonymous");

// Use built-in :response-time instead of custom one
const morganFormat =
  ":method :url :status :res[content-length] - :response-time ms :userId :remote-addr";

// Stream object to integrate with Winston
const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Morgan middleware configuration
const morganMiddleware = morgan(morganFormat, {
  stream: morganStream,
  skip: (req, res) => {
    return (
      res.statusCode < 400 &&
      (req.url === "/health" || req.url.startsWith("/public"))
    );
  },
});

module.exports = morganMiddleware;
