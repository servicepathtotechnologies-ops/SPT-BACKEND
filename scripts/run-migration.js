/**
 * Run SQL migration file. Usage: node scripts/run-migration.js sql/migrations/002_real_time_crm_status_and_history.sql
 * Loads .env from project root and uses DATABASE_URL.
 */
import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const migrationPath = process.argv[2];
if (!migrationPath) {
  console.error("Usage: node scripts/run-migration.js <path-to-migration.sql>");
  console.error("Example: node scripts/run-migration.js sql/migrations/002_real_time_crm_status_and_history.sql");
  process.exit(1);
}

const fullPath = path.isAbsolute(migrationPath) ? migrationPath : path.join(projectRoot, migrationPath);
if (!fs.existsSync(fullPath)) {
  console.error("Migration file not found:", fullPath);
  process.exit(1);
}

const sql = fs.readFileSync(fullPath, "utf8");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("[Migration] Success:", path.basename(fullPath));
  } catch (err) {
    console.error("[Migration] Error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
