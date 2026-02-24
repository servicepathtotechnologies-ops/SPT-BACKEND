/**
 * Server entry point — starts Express app and handles graceful shutdown.
 * Set NODE_ENV=production for production. Security and app config live in src/app.js and src/config.
 */
import "dotenv/config";
import app from "./src/app.js";
import config from "./src/config/index.js";
import { pool } from "./src/config/db.js";

const { port } = config.server;
const { timeoutMs } = config.shutdown;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port} (NODE_ENV=${config.env})`);
});

// ——— Graceful shutdown ———
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[Server] ${signal} received. Shutting down gracefully...`);

  server.close((err) => {
    if (err) {
      console.error("[Server] Error closing HTTP server:", err);
    } else {
      console.log("[Server] HTTP server closed.");
    }

    pool
      .end()
      .then(() => {
        console.log("[Server] Database pool closed.");
        process.exit(0);
      })
      .catch((poolErr) => {
        console.error("[Server] Error closing database pool:", poolErr);
        process.exit(1);
      });
  });

  // Force exit if shutdown hangs
  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout.");
    process.exit(1);
  }, timeoutMs);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Optional: log unhandled rejections (avoid silent failures)
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
});
