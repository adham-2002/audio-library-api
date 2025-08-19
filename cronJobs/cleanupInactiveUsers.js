const cron = require("node-cron");
const User = require("../models/users.model");
const logger = require("../utils/logger");
// at midnight
cron.schedule("0 0 * * *", async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago
  await User.deleteMany({
    deactivatedAt: { $lt: cutoffDate },
    isActive: false,
  });
  logger.info("Inactive users cleaned up");
});
