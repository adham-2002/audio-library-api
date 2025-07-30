const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    verbose: 5,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
    verbose: "cyan",
  },
};
winston.addColors(customLevels.colors);

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");

// Base log format
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.splat()
);

// Development console format (colorized)
const consoleFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} ${level}: ${message}${stack ? `\n${stack}` : ""}`;
  })
);

// File format (uncolorized JSON)
const fileFormat = winston.format.combine(
  baseFormat,
  winston.format.uncolorize(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: logLevel,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      stderrLevels: ["error"],
    }),
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// === File Transports for Production ===
if (isProduction) {
  // General error log
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 10 * 1024 * 1024,
      maxFiles: 7,
      format: fileFormat,
    })
  );

  // Combined logs (all levels)
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 14,
      format: fileFormat,
    })
  );

  // Handle uncaught exceptions in a separate file
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
      format: fileFormat,
    })
  );

  // Handle unhandled promise rejections in a separate file
  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(logDir, "rejections.log"),
      format: fileFormat,
    })
  );
}

module.exports = logger;
