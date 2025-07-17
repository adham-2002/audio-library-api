const app = require("./app");
const chalk = require("chalk");
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(chalk.yellow("================================="));
  console.log(chalk.green.bold("✅ Server is up and running!"));
  console.log(chalk.blue(`🌐 URL: http://localhost:${PORT}`));
  console.log(chalk.yellow("================================="));
  const env = process.env.NODE_ENV || "development";
  console.log(chalk.magenta(`🛠️  Running in ${env} mode`));
});
