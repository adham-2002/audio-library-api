const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server Running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    `Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`
  );
  process.exit(1);
});
