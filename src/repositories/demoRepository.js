/**
 * Demo repository — data access for demos table.
 */
import { pool } from "../config/db.js";

export const DEMO_STATUSES = ["Pending", "Scheduled", "Completed", "Cancelled", "Lead", "Lost"];
const MAX_LIST_LIMIT = 500;

/**
 * @param {{ limit?: number, offset?: number, status?: string, dateFrom?: string, dateTo?: string, search?: string }} opts
 */
export async function findAll(opts = {}) {
  const limit = Math.min(opts.limit ?? 100, MAX_LIST_LIMIT);
  const offset = Math.max(0, opts.offset ?? 0);

  const conditions = [];
  const params = [];
  let idx = 1;

  if (opts.status) {
    conditions.push(`status = $${idx}`);
    params.push(opts.status);
    idx++;
  }
  if (opts.dateFrom) {
    conditions.push(`created_at >= $${idx}::timestamp`);
    params.push(opts.dateFrom);
    idx++;
  }
  if (opts.dateTo) {
    conditions.push(`created_at <= $${idx}::timestamp`);
    params.push(opts.dateTo);
    idx++;
  }
  if (opts.search && opts.search.trim()) {
    const term = `%${opts.search.trim()}%`;
    conditions.push(`(full_name ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(term);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [result, countResult] = await Promise.all([
    pool.query(
      `SELECT id, full_name, email, company, demo_date, service, notes, status, created_at
       FROM demos ${where}
       ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM demos ${where}`,
      params
    ),
  ]);

  return {
    rows: result.rows,
    total: countResult.rows[0].total,
  };
}

export async function findById(id) {
  const result = await pool.query(
    `SELECT id, full_name, email, company, demo_date, service, notes, status, created_at
     FROM demos WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * @param {{ full_name: string, email: string, company?: string | null, demo_date: Date, service?: string | null, notes?: string | null }} data
 * @returns {Promise<object>} created row
 */
export async function create(data) {
  const result = await pool.query(
    `INSERT INTO demos (full_name, email, company, demo_date, service, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
     RETURNING id, full_name, email, company, demo_date, service, notes, status, created_at`,
    [
      data.full_name,
      data.email,
      data.company ?? null,
      data.demo_date,
      data.service ?? null,
      data.notes ?? null,
    ]
  );
  return result.rows[0];
}

export async function hasRecentByEmail(email, withinSeconds) {
  const result = await pool.query(
    `SELECT 1 FROM demos
     WHERE email = $1 AND created_at > NOW() - INTERVAL '1 second' * $2
     LIMIT 1`,
    [email.toLowerCase(), withinSeconds]
  );
  return result.rowCount > 0;
}

export async function deleteById(id) {
  const result = await pool.query("DELETE FROM demos WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}

/**
 * @param {string} id UUID
 * @param {string} status
 * @returns {Promise<object|null>} updated row or null
 */
export async function updateStatus(id, status) {
  if (!DEMO_STATUSES.includes(status)) return null;
  const result = await pool.query(
    `UPDATE demos SET status = $1 WHERE id = $2
     RETURNING id, full_name, email, company, demo_date, service, notes, status, created_at`,
    [status, id]
  );
  return result.rows[0] || null;
}
