/**
 * PostgreSQL connection pool — used for all DB queries.
 * Uses config for env; connection string from DATABASE_URL.
 */
import pg from "pg";
import config from "./index.js";

const { Pool } = pg;

const useSsl = config.isProduction || config.database.ssl;
// Supabase and many cloud Postgres use certs that need rejectUnauthorized: false
// unless you provide a CA bundle. Set DATABASE_SSL_REJECT_UNAUTHORIZED=true in production with your own CA if needed.
const sslRejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";
const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ...(useSsl && {
    ssl: { rejectUnauthorized: sslRejectUnauthorized },
  }),
});

pool.on("error", (err) => {
  console.error("[DB] Pool error:", err.message);
});

// Test connection on startup (skip in test if needed)
if (config.env !== "test") {
  pool
    .query("SELECT 1")
    .then(() => {
      console.log("[DB] Connection successful.");
    })
    .catch((err) => {
      console.error("[DB] Connection failed:", err.message);
    });
}

export { pool };
