/**
 * Lost controller — contacts and demos where status = Lost.
 */
import * as contactRepository from "../repositories/contactRepository.js";
import * as demoRepository from "../repositories/demoRepository.js";

/**
 * GET /api/lost — all records (contacts + demos) with status = Lost.
 */
export async function getLost(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const [contactResult, demoResult] = await Promise.all([
      contactRepository.findAll({ limit: 500, offset: 0, status: "Lost" }),
      demoRepository.findAll({ limit: 500, offset: 0, status: "Lost" }),
    ]);

    const contactRows = contactResult.rows.map((r) => ({ ...r, entity_type: "contact" }));
    const demoRows = demoResult.rows.map((r) => ({ ...r, entity_type: "demo" }));

    const combined = [...contactRows, ...demoRows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = combined.length;
    const data = combined.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data,
      count: data.length,
      total,
      contactsTotal: contactResult.total,
      demosTotal: demoResult.total,
    });
  } catch (err) {
    next(err);
  }
}
