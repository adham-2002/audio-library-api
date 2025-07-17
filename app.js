require("dotenv").config({ quiet: true });
const express = require("express");
const app = express();
app.use(express.json());

module.exports = app;
