/**
 * Demo controller — HTTP layer for demo/booking submissions.
 */
import * as demoRepository from "../repositories/demoRepository.js";
import * as demoService from "../services/demoService.js";
import * as statusService from "../services/statusService.js";
import { emitDemoStatusUpdated } from "../services/socketService.js";

export async function getAllDemos(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const status = req.query.status?.trim() || undefined;
    const dateFrom = req.query.dateFrom?.trim() || undefined;
    const dateTo = req.query.dateTo?.trim() || undefined;
    const search = req.query.search?.trim() || undefined;

    const { rows, total } = await demoRepository.findAll({
      limit,
      offset,
      status,
      dateFrom,
      dateTo,
      search,
    });

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

export async function updateDemoStatus(req, res, next) {
  try {
    const id = req.params.id;
    const newStatus = req.body.status;
    const updatedBy = req.user?.id || null;

    const current = await demoRepository.findById(id);
    if (!current) {
      return res.status(404).json({ success: false, message: "Demo not found." });
    }

    const updated = await demoRepository.updateStatus(id, newStatus);
    if (!updated) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    await statusService.afterStatusChange(
      "demo",
      id,
      current.status,
      newStatus,
      updatedBy,
      { email: current.email, full_name: current.full_name }
    );

    emitDemoStatusUpdated(updated);

    res.status(200).json({ success: true, data: updated, message: "Status updated." });
  } catch (err) {
    next(err);
  }
}

export async function deleteDemo(req, res, next) {
  try {
    const deleted = await demoRepository.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Demo booking not found." });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
