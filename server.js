const logger = require("./utils/logger");
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.stack}`);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error(
    `Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`
  );
  process.exit(1);
});
const app = require("./app");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redisConnect");
(async () => {
  try {
    await connectDB();
    await connectRedis();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start the server", err);
    process.exit(1);
  }
})();
