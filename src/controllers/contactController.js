/**
 * Contact controller — HTTP layer; delegates to services/repositories.
 */
import * as contactRepository from "../repositories/contactRepository.js";
import * as contactService from "../services/contactService.js";
import * as statusService from "../services/statusService.js";
import { emitContactStatusUpdated } from "../services/socketService.js";

export async function getAllContacts(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const status = req.query.status?.trim() || undefined;
    const dateFrom = req.query.dateFrom?.trim() || undefined;
    const dateTo = req.query.dateTo?.trim() || undefined;
    const search = req.query.search?.trim() || undefined;

    const { rows, total } = await contactRepository.findAll({
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

export async function submitContact(req, res, next) {
  try {
    await contactService.submitContact(req.body);
    res.status(201).json({
      success: true,
      message: "Your message has been received. We will contact you soon.",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateContactStatus(req, res, next) {
  try {
    const id = req.params.id;
    const newStatus = req.body.status;
    const updatedBy = req.user?.id || null;

    const current = await contactRepository.findById(id);
    if (!current) {
      return res.status(404).json({ success: false, message: "Contact not found." });
    }

    const updated = await contactRepository.updateStatus(id, newStatus);
    if (!updated) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    await statusService.afterStatusChange(
      "contact",
      id,
      current.status,
      newStatus,
      updatedBy,
      { email: current.email, full_name: current.full_name }
    );

    emitContactStatusUpdated(updated);

    res.status(200).json({ success: true, data: updated, message: "Status updated." });
  } catch (err) {
    next(err);
  }
}

export async function deleteContact(req, res, next) {
  try {
    const deleted = await contactRepository.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Contact not found." });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
