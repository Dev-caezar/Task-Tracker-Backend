import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Taskify API",
      version: "1.0.0",
      description: "Task & Auth API Documentation",
    },

    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Local server",
      },
      {
        url: "https://task-tracker-backend-1-v63c.onrender.com/api/v1",
        description: "Production server",
      },
    ],

    // 🔐 BEARER TOKEN AUTH SETUP
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    // 🔐 APPLY GLOBALLY (all routes protected by default)
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [path.resolve(__dirname, "../routes/*.js")],
};

export const swaggerSpec = swaggerJSDoc(options);
