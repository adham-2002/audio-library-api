const postmanToOpenApi = require("@readme/postman-to-openapi");
const fs = require("fs");
const path = require("path");
const YAML = require("yamljs");

// Function to enhance OpenAPI spec with authentication
function enhanceOpenAPIAuth(filePath) {
  console.log("🔧 Enhancing OpenAPI spec with authentication...");

  // Load the YAML file
  const openApiSpec = YAML.load(filePath);

  // Add security schemes
  if (!openApiSpec.components) {
    openApiSpec.components = {};
  }

  openApiSpec.components.securitySchemes = {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description:
        'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
    },
  };

  // Define public endpoints that don't require authentication
  const publicEndpoints = [
    "/auth/signin",
    "/auth/signup",
    "/auth/refresh-token",
    "/health",
  ];

  // Add security to all endpoints except public ones
  if (openApiSpec.paths) {
    Object.keys(openApiSpec.paths).forEach((pathKey) => {
      const isPublicEndpoint = publicEndpoints.some((publicPath) =>
        pathKey.includes(publicPath)
      );

      if (!isPublicEndpoint) {
        Object.keys(openApiSpec.paths[pathKey]).forEach((method) => {
          if (["get", "post", "put", "patch", "delete"].includes(method)) {
            if (!openApiSpec.paths[pathKey][method].security) {
              openApiSpec.paths[pathKey][method].security = [
                { bearerAuth: [] },
              ];
            }
          }
        });
      }
    });
  }

  // Add global security as fallback
  if (!openApiSpec.security) {
    openApiSpec.security = [{ bearerAuth: [] }];
  }

  // Save the enhanced spec
  const yamlString = YAML.stringify(openApiSpec, 2);
  fs.writeFileSync(filePath, yamlString);

  console.log("✅ Authentication configuration enhanced successfully!");
}

async function convertPostmanToOpenAPI() {
  try {
    // Define file paths
    const collectionPath = path.join(
      __dirname,
      "..",
      "postman",
      "Music Player api.postman_collection.json"
    );
    const environmentPath = path.join(
      __dirname,
      "..",
      "postman",
      "Music Player.postman_environment.json"
    );
    const outputPath = path.join(__dirname, "..", "docs", "openapi.yaml");

    // Create docs directory if it doesn't exist
    const docsDir = path.join(__dirname, "..", "docs");
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    console.log("🔄 Converting Postman collection to OpenAPI...");
    console.log(`📁 Collection: ${collectionPath}`);
    console.log(`🌍 Environment: ${environmentPath}`);

    // Convert Postman collection to OpenAPI
    const result = await postmanToOpenApi(collectionPath, outputPath, {
      info: {
        title: "Audio Library API",
        version: "1.0.0",
        description:
          "A comprehensive API for managing audio files and users with Redis-based session management",
        contact: {
          name: "API Support",
          email: "support@audiolibrary.com",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      servers: [
        {
          url: "http://localhost:3000/api/v1",
          description: "Development server",
        },
        {
          url: "https://api.audiolibrary.com/v1",
          description: "Production server",
        },
      ],
      externalDocs: {
        description: "Find more info here",
        url: "https://github.com/adham-2002/audio-library-api",
      },
      folders: {
        concat: true,
        separator: "/",
      },
      replaceVars: true,
      includeAuthInfoInExample: false,
    });

    console.log("✅ Conversion completed successfully!");

    // Enhance with authentication
    enhanceOpenAPIAuth(outputPath);

    console.log(`📄 OpenAPI spec saved to: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error("❌ Error converting Postman collection:", error);
    throw error;
  }
}

// Run the conversion
convertPostmanToOpenAPI()
  .then((outputPath) => {
    console.log(
      "\n🎉 Postman collection successfully converted to OpenAPI YAML!"
    );
    console.log("\n📋 Next steps:");
    console.log(
      "1. Install swagger-ui-express: npm install swagger-ui-express"
    );
    console.log("2. The OpenAPI spec is ready to use with Swagger UI");
    console.log(`3. File location: ${outputPath}`);
  })
  .catch((error) => {
    console.error("\n💥 Conversion failed:", error.message);
    process.exit(1);
  });
