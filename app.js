require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const userRoute = require("./routes/user.routes");
const audioRoute = require("./routes/audio.routes");
const adminRoute = require("./routes/admin.routes");
const authRoute = require("./routes/auth.routes");
const sessionRoute = require("./routes/session.routes");
const core = require("cors");

const morganMiddleware = require("./middlewares/morganLogger");
const {
  globalError,
  handleNotFound,
} = require("./middlewares/globalErrorHandler");
const app = express();
app.use(core());
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(morganMiddleware);
app.use("/api/v1", userRoute);
app.use("/api/v1", audioRoute);
app.use("/api/v1", adminRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/sessions", sessionRoute);
if (process.env.NODE_ENV === "development") {
  console.log("Development Mode");
} else {
  console.log("Production Mode");
}
app.use(handleNotFound);
app.use(globalError);
module.exports = app;
