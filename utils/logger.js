const winston = require("winston");

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
    return `${timestamp} ${level}: ${message} ${stack ? `\n${stack}` : ""}`;
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
    // Console transport (always enabled)
    new winston.transports.Console({
      format: consoleFormat,
      stderrLevels: ["error"],
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: "logs/rejections.log",
      format: fileFormat,
    }),
  ],
  exitOnError: false,
});

// Add file transports for production
if (isProduction) {
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 10 * 1024 * 1024,
      maxFiles: 7,
      format: fileFormat,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 20 * 1024 * 1024,
      maxFiles: 14,
      format: fileFormat,
    })
  );
}

module.exports = logger;
