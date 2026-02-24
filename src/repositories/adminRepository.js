/**
 * Admin repository — data access for admins table.
 * All SQL and DB access for admins lives here.
 */
import { pool } from "../config/db.js";

/**
 * @param {string} email
 * @returns {Promise<{ id: string, email: string, password: string } | null>}
 */
export async function findByEmail(email) {
  const result = await pool.query(
    "SELECT id, email, password FROM admins WHERE email = $1",
    [email.trim().toLowerCase()]
  );
  return result.rows[0] ?? null;
}

/**
 * @param {{ email: string, passwordHash: string }} data
 * @returns {Promise<{ id: string, email: string } | null>} created row or null on conflict
 */
export async function create(data) {
  const result = await pool.query(
    `INSERT INTO admins (email, password) VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING RETURNING id, email`,
    [data.email.trim().toLowerCase(), data.passwordHash]
  );
  return result.rows[0] ?? null;
}
