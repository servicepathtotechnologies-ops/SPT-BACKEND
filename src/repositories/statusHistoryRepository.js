/**
 * Status history repository — log status changes for contacts and demos.
 */
import { pool } from "../config/db.js";

/**
 * Insert a status change record.
 * @param {{ entity_type: 'contact'|'demo', entity_id: string, old_status: string|null, new_status: string, updated_by: string|null }}
 */
export async function create(record) {
  await pool.query(
    `INSERT INTO status_history (entity_type, entity_id, old_status, new_status, updated_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      record.entity_type,
      record.entity_id,
      record.old_status ?? null,
      record.new_status,
      record.updated_by ?? null,
    ]
  );
}

/**
 * Get recent activity for activity feed with entity display names.
 * @param {{ limit?: number, offset?: number }} opts
 */
export async function findRecentActivity(opts = {}) {
  const limit = Math.min(opts.limit ?? 50, 200);
  const offset = Math.max(0, opts.offset ?? 0);

  const result = await pool.query(
    `SELECT h.id, h.entity_type, h.entity_id, h.old_status, h.new_status, h.updated_by, h.updated_at,
            c.full_name AS contact_name,
            d.full_name AS demo_name
     FROM status_history h
     LEFT JOIN contacts c ON h.entity_type = 'contact' AND h.entity_id = c.id
     LEFT JOIN demos d ON h.entity_type = 'demo' AND h.entity_id = d.id
     ORDER BY h.updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const rows = result.rows.map((r) => {
    const full_name = r.contact_name || r.demo_name || "Unknown";
    return {
      id: r.id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      old_status: r.old_status,
      new_status: r.new_status,
      updated_by: r.updated_by,
      updated_at: r.updated_at,
      full_name,
    };
  });

  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM status_history");

  return {
    rows,
    total: countResult.rows[0].total,
  };
}
