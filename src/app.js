/**
 * Express application — security middleware, routes, and error handling.
 * Uses environment-based config (development / production).
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import config from "./config/index.js";
import contactRoutes from "./routes/contactRoutes.js";
import demoRoutes from "./routes/demoRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const { isProduction } = config;

// Behind Render or other reverse proxies, trust the first proxy hop so
// express-rate-limit can correctly use X-Forwarded-For.
if (isProduction) {
  app.set("trust proxy", 1);
}

// ——— 1. Helmet — security headers ———
app.use(
  helmet({
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ——— 2. CORS — allow only frontend domain(s) ———
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const { allowedOrigins } = config.cors;
    if (allowedOrigins.length === 0) {
      if (!isProduction) return callback(null, true);
      return callback(null, false);
    }
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// ——— 3. Request size limit ———
app.use(express.json({ limit: config.security.requestSizeLimit }));

// ——— 4. Logging (morgan) ———
app.use(morgan(config.logging.morganFormat));

// ——— 5. Rate limiting ———
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", generalLimiter);

const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many submissions. Please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/contact", contactLimiter);

const demoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many demo requests. Please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/demo", demoLimiter);

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/admin/login", adminLoginLimiter);

// ——— Health check ———
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK", env: config.env });
});

// ——— API routes ———
app.use("/api/contact", contactRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Not found",
    path: req.originalUrl,
  });
});

// ——— Centralized error handler (must be last) ———
app.use(errorHandler);

export default app;
