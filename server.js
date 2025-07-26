const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { connectRedis } = require("./config/redisConnect");
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.stack}`);
  process.exit(1);
});
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
    process.exit(1); // Exit if DB or Redis fails
  }
})();
process.on("unhandledRejection", (reason) => {
  logger.error(
    `Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`
  );
  process.exit(1);
});
