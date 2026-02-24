/**
 * Demo controller — HTTP layer for demo/booking submissions.
 */
import * as demoRepository from "../repositories/demoRepository.js";
import * as demoService from "../services/demoService.js";

/**
 * GET /api/demo — list demo bookings (admin only).
 */
export async function getAllDemos(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const { rows, total } = await demoRepository.findAll({ limit, offset });

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

/**
 * POST /api/demo — submit demo booking (public).
 */
export async function submitDemo(req, res, next) {
  try {
    await demoService.submitDemo(req.body);
    res.status(201).json({
      success: true,
      message: "Demo requested successfully. We'll send a confirmation shortly.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/demo/:id — delete one demo (admin only).
 */
export async function deleteDemo(req, res, next) {
  try {
    const deleted = await demoRepository.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Demo booking not found.",
      });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
