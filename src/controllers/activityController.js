/**
 * Activity controller — status history and activity feed for CRM.
 */
import * as statusHistoryRepository from "../repositories/statusHistoryRepository.js";

/**
 * GET /api/activity — recent status changes for activity feed.
 */
export async function getActivity(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const { rows, total } = await statusHistoryRepository.findRecentActivity({ limit, offset });

    res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      total,
    });
  } catch (err) {
    next(err);
  }
}
