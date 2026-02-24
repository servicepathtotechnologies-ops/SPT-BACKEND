/**
 * Demo repository — data access for demos table.
 */
import { pool } from "../config/db.js";

const MAX_LIST_LIMIT = 500;

/**
 * @param {{ limit: number, offset: number }} opts
 * @returns {{ rows: Array<{id, full_name, email, company, demo_date, service, notes, created_at}>, total: number }}
 */
export async function findAll(opts = {}) {
  const limit = Math.min(opts.limit ?? 100, MAX_LIST_LIMIT);
  const offset = Math.max(0, opts.offset ?? 0);

  const [result, countResult] = await Promise.all([
    pool.query(
      `SELECT id, full_name, email, company, demo_date, service, notes, created_at
       FROM demos ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    pool.query("SELECT COUNT(*)::int AS total FROM demos"),
  ]);

  return {
    rows: result.rows,
    total: countResult.rows[0].total,
  };
}

/**
 * @param {{ full_name: string, email: string, company?: string | null, demo_date: Date, service?: string | null, notes?: string | null }} data
 * @returns {Promise<void>}
 */
export async function create(data) {
  await pool.query(
    `INSERT INTO demos (full_name, email, company, demo_date, service, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      data.full_name,
      data.email,
      data.company ?? null,
      data.demo_date,
      data.service ?? null,
      data.notes ?? null,
    ]
  );
}

/**
 * @param {string} email
 * @param {number} withinSeconds
 * @returns {Promise<boolean>}
 */
export async function hasRecentByEmail(email, withinSeconds) {
  const result = await pool.query(
    `SELECT 1 FROM demos
     WHERE email = $1 AND created_at > NOW() - INTERVAL '1 second' * $2
     LIMIT 1`,
    [email.toLowerCase(), withinSeconds]
  );
  return result.rowCount > 0;
}

/**
 * @param {string} id UUID
 * @returns {Promise<boolean>}
 */
export async function deleteById(id) {
  const result = await pool.query("DELETE FROM demos WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}
