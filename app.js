require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const userRoute = require("./routes/user.routes");
const audioRoute = require("./routes/audio.routes");
const adminRoute = require("./routes/admin.routes");
const authRoute = require("./routes/auth.routes");
const sessionRoute = require("./routes/session.routes");
const playlistRoute = require("./routes/playlist.routes");
const core = require("cors");

const morganMiddleware = require("./middlewares/morganLogger");
const {
  globalError,
  handleNotFound,
} = require("./middlewares/globalErrorHandler");

const app = express();

// Load OpenAPI specification
let swaggerDocument;
try {
  swaggerDocument = YAML.load("./docs/openapi.yaml");
} catch (error) {
  console.warn(
    '⚠️ OpenAPI spec not found. Run "npm run convert-postman" to generate it.'
  );
  swaggerDocument = {
    openapi: "3.0.0",
    info: { title: "Audio Library API", version: "1.0.0" },
    paths: {},
  };
}

// Swagger UI options
const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .btn.authorize { 
      background: linear-gradient(45deg, #4ecdc4, #44a08d);
      border: none;
      color: white;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 8px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 10px rgba(78, 205, 196, 0.3);
    }
    .swagger-ui .btn.authorize:hover { 
      background: linear-gradient(45deg, #44a08d, #3d8b7f);
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
    }
  `,
};

app.use(
  core({
    origin: true, // Allow all origins in development
    credentials: true, // Enable credentials (cookies)
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(morganMiddleware);

// API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerOptions)
);

// API documentation redirect
app.get("/docs", (req, res) => {
  res.redirect("/api-docs");
});

// Landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Authentication guide
app.get("/auth-guide.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "auth-guide.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Audio Library API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    documentation: "/api-docs",
  });
});

app.use("/api/v1", userRoute);
app.use("/api/v1", audioRoute);
app.use("/api/v1", adminRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/sessions", sessionRoute);
app.use("/api/v1/playlists", playlistRoute);
if (process.env.NODE_ENV === "development") {
  console.log("Development Mode");
} else {
  console.log("Production Mode");
}
app.use(handleNotFound);
app.use(globalError);
module.exports = app;
