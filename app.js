require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const userRoute = require("./routes/user.routes");
const audioRoute = require("./routes/audio.routes");
const adminRoute = require("./routes/admin.routes");
const playlistRoute = require('./routes/playlist.routes')
const {
  globalError,
  handleNotFound,
} = require("./middlewares/globalErrorHandler");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public/images"));
app.use("/api/v1", userRoute);
app.use("/api/v1", audioRoute);
app.use("/api/v1", adminRoute);
app.use("/api/v1",playlistRoute);
if (process.env.NODE_ENV === "development") {
  console.log("Development Mode");
} else {
  console.log("Production Mode");
}
app.use(handleNotFound);
app.use(globalError);
module.exports = app;
