/**
 * Contact controller — HTTP layer only; delegates to services/repositories.
 * Handles req/res and next(err). No business logic or SQL here.
 */
import * as contactRepository from "../repositories/contactRepository.js";
import * as contactService from "../services/contactService.js";

/**
 * GET /api/contact — list submissions (admin only).
 */
export async function getAllContacts(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const { rows, total } = await contactRepository.findAll({ limit, offset });

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
 * POST /api/contact — submit form (validation + spam check in service).
 */
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

/**
 * DELETE /api/contact/:id — delete one (admin only).
 */
export async function deleteContact(req, res, next) {
  try {
    const deleted = await contactRepository.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
