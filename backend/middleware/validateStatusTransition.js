const mongoose = require('mongoose');
const LaundryNote = require('../models/laundryNote');

const validateStatusTransition = async (req, res, next) => {
  try {
    const { note_status, businessId } = req.body;
    const effectiveBusinessId = businessId || req.businessId;

    console.log("Validating status transition:", {
      noteId: req.params.id,
      note_status,
      businessId: effectiveBusinessId,
      method: req.method,
      path: req.path,
    });

    // Validar businessId
    if (!effectiveBusinessId || !mongoose.Types.ObjectId.isValid(effectiveBusinessId)) {
      console.error("Invalid businessId:", effectiveBusinessId);
      return res.status(400).json({ success: false, message: "BusinessId inválido" });
    }

    // Validar noteId
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error("Invalid noteId:", req.params.id);
      return res.status(400).json({ success: false, message: "NoteId inválido" });
    }

    // Obtener la nota actual
    const note = await LaundryNote.findOne({
      _id: req.params.id,
      businessId: effectiveBusinessId,
    });

    if (!note) {
      console.error("Note not found:", { noteId: req.params.id, businessId: effectiveBusinessId });
      return res.status(404).json({ success: false, message: "Nota no encontrada" });
    }

    console.log("Note found:", {
      _id: note._id,
      folio: note.folio,
      note_status: note.note_status,
      total: note.total,
      abonos: note.abonos,
    });

    // Si no hay cambio de estado, asignar nota y continuar
    if (!note_status) {
      req.note = note;
      return next();
    }

    // Validar transiciones
    if (note_status === "pagado" && note.note_status !== "pendiente") {
      return res.status(400).json({
        success: false,
        message: "La nota debe estar Pendiente para marcar como Pagada.",
      });
    }

    if (note_status === "entregado" && note.note_status !== "pagado") {
      return res.status(400).json({
        success: false,
        message: "La nota debe estar Pagada para marcar como Entregada.",
      });
    }

    // Validar pago completo si se marca como pagado
    if (note_status === "pagado") {
      const { abonos = [] } = req.body;
      const totalAbonado = [...(note.abonos || []), ...abonos].reduce((sum, ab) => sum + ab.amount, 0);
      if (totalAbonado < note.total) {
        return res.status(400).json({
          success: false,
          message: `Falta pagar $${(note.total - totalAbonado).toFixed(2)}.`,
        });
      }
    }

    req.note = note;
    next();
  } catch (error) {
    console.error("Error en validación de estado:", {
      message: error.message,
      stack: error.stack,
      noteId: req.params.id,
      businessId: req.body.businessId || req.businessId,
    });
    res.status(500).json({ success: false, message: "Error en validación de estado" });
  }
};

module.exports = validateStatusTransition;