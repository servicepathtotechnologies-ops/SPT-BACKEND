/**
 * Environment-based configuration — single source of truth for app and server.
 * Use NODE_ENV=development | production. Default: development.
 */
import "dotenv/config";

const NODE_ENV = process.env.NODE_ENV || "development";
const isDevelopment = NODE_ENV === "development";
const isProduction = NODE_ENV === "production";

const config = {
  env: NODE_ENV,
  isDevelopment,
  isProduction,

  server: {
    port: Number(process.env.PORT) || 5000,
  },

  database: {
    url: process.env.DATABASE_URL,
    /** Set to "true" when using Supabase or any remote DB that requires SSL (e.g. from local dev) */
    ssl: process.env.DATABASE_SSL === "true",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "",
    allowedOrigins: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
      : [],
  },

  security: {
    requestSizeLimit: process.env.REQUEST_SIZE_LIMIT || "10kb",
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  mail: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT) || 587,
  },

  logging: {
    /** Morgan format: "combined" (prod) or "dev" (development) */
    morganFormat: isProduction ? "combined" : "dev",
  },

  shutdown: {
    /** Max time to wait for graceful shutdown (ms) before force exit */
    timeoutMs: 10000,
  },
};

export default config;
export { config, isDevelopment, isProduction, NODE_ENV };
