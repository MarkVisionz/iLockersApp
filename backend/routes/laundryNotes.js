const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { auth, isBusinessOwner } = require("../middleware/auth");
const LaundryNote = require("../models/laundryNote");
const Service = require("../models/laundryServices");
const { sendWhatsAppMessage } = require("../utils/sendWhatsApp");
const moment = require("moment");
const validateStatusTransition = require("../middleware/validateStatusTransition");

const VALID_PAYMENT_METHODS = ["efectivo", "tarjeta", "transferencia"];
const VALID_NOTE_STATUS = ["pendiente", "pagado", "entregado"];
const VALID_CLEANING_STATUS = ["sucia", "lavado", "listo_para_entregar", "entregado"];

const isValidPhone = (phone) => /^\+?[0-9]{7,15}$/.test(phone);

const validateNote = async (req, res, next) => {
  try {
    const {
      name,
      phoneNumber,
      folio,
      total,
      abonos = [],
      services,
      payment_method,
      note_status,
      cleaning_status,
      businessId,
      suavitelDesired,
      suavitelShots,
      suavitelPrice,
    } = req.body;

    const effectiveBusinessId = businessId || req.businessId;
    if (!effectiveBusinessId || !mongoose.Types.ObjectId.isValid(effectiveBusinessId)) {
      return res.status(400).json({ success: false, message: "BusinessId inválido" });
    }

    if (!name || name.length < 3) {
      return res.status(400).json({ success: false, message: "Nombre del cliente requerido" });
    }

    if (phoneNumber && !isValidPhone(phoneNumber)) {
      return res.status(400).json({ success: false, message: "Teléfono inválido" });
    }

    if (!folio || typeof folio !== "string") {
      return res.status(400).json({ success: false, message: "Folio requerido" });
    }

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: "Debes agregar al menos un servicio" });
    }

    const serviceIds = services.map((s) => s.serviceId);
    const validServices = await Service.find({ _id: { $in: serviceIds }, businessId: effectiveBusinessId });
    if (validServices.length !== services.length) {
      return res.status(400).json({ success: false, message: "Uno o más servicios son inválidos" });
    }

    if (note_status === "pagado" && !VALID_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ success: false, message: "Método de pago inválido para nota pagada" });
    }

    if (abonos.length > 0 && !abonos.every((a) => VALID_PAYMENT_METHODS.includes(a.method))) {
      return res.status(400).json({ success: false, message: "Método de pago inválido en abonos" });
    }

    if (abonos.reduce((sum, a) => sum + a.amount, 0) > total) {
      return res.status(400).json({ success: false, message: "El abono no puede ser mayor al total" });
    }

    if (!VALID_NOTE_STATUS.includes(note_status)) {
      return res.status(400).json({ success: false, message: "Estado de nota inválido" });
    }

    if (!VALID_CLEANING_STATUS.includes(cleaning_status)) {
      return res.status(400).json({ success: false, message: "Estado de limpieza inválido" });
    }

    if (suavitelDesired && (typeof suavitelShots !== "number" || suavitelShots < 0)) {
      return res.status(400).json({ success: false, message: "Cantidad de shots de suavitel inválida" });
    }

    if (suavitelDesired && (typeof suavitelPrice !== "number" || suavitelPrice < 0)) {
      return res.status(400).json({ success: false, message: "Precio de suavitel inválido" });
    }

    req.body.businessId = effectiveBusinessId;
    next();
  } catch (error) {
    console.error("Error en validación:", error);
    res.status(500).json({ success: false, message: "Error en validación" });
  }
};

const validateCleaningStatus = async (req, res, next) => {
  try {
    const { cleaning_status, businessId } = req.body;
    const effectiveBusinessId = businessId || req.businessId;

    if (!effectiveBusinessId || !mongoose.Types.ObjectId.isValid(effectiveBusinessId)) {
      return res.status(400).json({ success: false, message: "BusinessId inválido" });
    }

    if (!cleaning_status || !VALID_CLEANING_STATUS.includes(cleaning_status)) {
      return res.status(400).json({ success: false, message: "Estado de limpieza inválido" });
    }

    if (cleaning_status === "entregado") {
      return res.status(400).json({
        success: false,
        message: "No se puede cambiar a 'entregado' directamente. Use note_status.",
      });
    }

    req.body.businessId = effectiveBusinessId;
    next();
  } catch (error) {
    console.error("Error en validación de cleaning_status:", error);
    res.status(400).json({ success: false, message: "Error en validación de cleaning_status" });
  }
};

const validatePaymentUpdate = async (req, res, next) => {
  try {
    const { note_status, abonos, payment_method, businessId } = req.body;
    const effectiveBusinessId = businessId || req.businessId;

    console.log("Validating payment update:", {
      noteId: req.params.id,
      note_status,
      abonos,
      payment_method,
      businessId: effectiveBusinessId,
    });

    if (!effectiveBusinessId || !mongoose.Types.ObjectId.isValid(effectiveBusinessId)) {
      console.error("Invalid businessId:", effectiveBusinessId);
      return res.status(400).json({ success: false, message: "BusinessId inválido" });
    }

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error("Invalid noteId:", req.params.id);
      return res.status(400).json({ success: false, message: "NoteId inválido" });
    }

    if (note_status && !VALID_NOTE_STATUS.includes(note_status)) {
      return res.status(400).json({ success: false, message: "Estado de nota inválido" });
    }

    if (abonos && (!Array.isArray(abonos) || !abonos.every((a) => VALID_PAYMENT_METHODS.includes(a.method) && typeof a.amount === "number" && a.amount > 0))) {
      return res.status(400).json({ success: false, message: "Abonos inválidos" });
    }

    if (note_status === "pagado" && !VALID_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ success: false, message: "Método de pago inválido para nota pagada" });
    }

    req.body.businessId = effectiveBusinessId;
    next();
  } catch (error) {
    console.error("Error en validación de pago:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(400).json({ success: false, message: "Error en validación de pago" });
  }
};

router.post("/", auth, isBusinessOwner, validateNote, async (req, res) => {
  try {
    const note = new LaundryNote(req.body);
    await note.save();
    console.log("Emitting noteCreated:", { businessId: req.body.businessId, data: note.toObject() });
    req.io?.emit("noteCreated", {
      businessId: req.body.businessId,
      event: "noteCreated",
      data: note.toObject(),
    });

    if (req.body.phoneNumber) {
      try {
        const servicesWithUnits = await Promise.all(
          req.body.services.map(async (svc) => {
            const service = await Service.findById(svc.serviceId);
            if (!service) return null;

            if (service.type === "simple") {
              return {
                name: svc.name,
                quantity: svc.quantity,
                price: svc.price,
                unit: svc.unit || service.unit || "pza",
              };
            } else {
              const size = service.sizes.find((s) => svc.name.includes(`(${s.name})`));
              return {
                name: svc.name,
                quantity: svc.quantity,
                price: svc.price,
                unit: svc.unit || size?.unit || "pza",
              };
            }
          })
        ).then((results) => results.filter(Boolean));

        const formatServiceName = (str) =>
          str
            .replace(/_/g, " ")
            .replace(/-/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());

        const serviciosTexto = servicesWithUnits.map((svc) => {
          const total = (svc.quantity * svc.price).toFixed(2);
          return `• ${formatServiceName(svc.name)}: ${svc.quantity} ${svc.unit} x $${svc.price} = $${total}`;
        });

        if (req.body.suavitelDesired && req.body.suavitelShots > 0) {
          serviciosTexto.push(
            `• Suavitel: ${req.body.suavitelShots} shot${req.body.suavitelShots > 1 ? "s" : ""} x $${req.body.suavitelPrice} = $${(req.body.suavitelShots * req.body.suavitelPrice).toFixed(2)}`
          );
        }

        await sendWhatsAppMessage({
          to: req.body.phoneNumber.startsWith("52") ? req.body.phoneNumber : `52${req.body.phoneNumber}`,
          templateName: "nueva_nota",
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: req.body.name || "Cliente" },
                { type: "text", text: req.body.folio },
                { type: "text", text: serviciosTexto.join(", ") || "Sin servicios" },
                { type: "text", text: `$${req.body.total.toFixed(2)}` },
                { type: "text", text: req.body.phoneNumber },
              ],
            },
          ],
        });
      } catch (whatsAppError) {
        console.error("Error al enviar mensaje de WhatsApp:", whatsAppError.message);
      }
    }

    res.status(201).json({ success: true, message: "nota creada", data: note });
  } catch (error) {
    console.error("Error al crear nota:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/:id/cleaning-status", auth, isBusinessOwner, validateCleaningStatus, async (req, res) => {
  try {
    const { cleaning_status, businessId } = req.body;
    const note = await LaundryNote.findOne({ _id: req.params.id, businessId });
    if (!note) {
      return res.status(404).json({ success: false, message: "nota no encontrada" });
    }

    note.cleaning_status = cleaning_status;
    if (cleaning_status === "listo_para_entregar" && note.phoneNumber) {
      try {
        const totalAbonos = (note.abonos || []).reduce((sum, ab) => sum + ab.amount, 0);
        const pendiente = note.total - totalAbonos;
        const estatus = note.note_status === "pagado" ? "Pagado" : "Pendiente";

        const templateName = note.note_status === "pagado" ? "ropa_pagada" : "ropa_lista";
        let components;

        if (templateName === "ropa_pagada") {
          components = [
            {
              type: "body",
              parameters: [
                { type: "text", text: note.name || "Cliente" },
                { type: "text", text: note.folio },
                { type: "text", text: estatus },
                { type: "text", text: `$${note.total.toFixed(2)}` },
              ],
            },
          ];
        } else {
          components = [
            {
              type: "body",
              parameters: [
                { type: "text", text: note.name || "Cliente" },
                { type: "text", text: note.folio },
                { type: "text", text: estatus },
                { type: "text", text: `$${totalAbonos.toFixed(2)}` },
                { type: "text", text: `$${pendiente.toFixed(2)}` },
                { type: "text", text: `$${note.total.toFixed(2)}` },
              ],
            },
          ];
        }

        await sendWhatsAppMessage({
          to: note.phoneNumber.startsWith("52") ? note.phoneNumber : `52${note.phoneNumber}`,
          templateName,
          components,
        });
      } catch (whatsAppError) {
        console.error("Error al enviar mensaje de WhatsApp:", whatsAppError.message);
        note.whatsappError = whatsAppError.message;
      }
    }

    const updatedNote = await note.save();
    console.log("Emitting noteUpdated:", { businessId, data: updatedNote.toObject() });
    req.io?.emit("noteUpdated", {
      businessId,
      event: "noteUpdated",
      data: updatedNote.toObject(),
    });
    res.json({ success: true, message: "Estado de limpieza actualizado", data: updatedNote });
  } catch (error) {
    console.error("Error al actualizar cleaning_status:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/:id/payment", auth, isBusinessOwner, validatePaymentUpdate, validateStatusTransition, async (req, res) => {
  try {
    const { note_status, abonos, payment_method, businessId } = req.body;
    if (!req.note) {
      console.error("req.note is undefined:", { noteId: req.params.id, businessId });
      return res.status(404).json({ success: false, message: "Nota no encontrada en el contexto" });
    }

    const note = req.note;
    console.log("Processing payment update for note:", { _id: note._id, folio: note.folio });

    if (note_status) {
      if (note_status === "pagado" && !note.paidAt) {
        note.paidAt = new Date();
        note.payment_method = payment_method || note.payment_method;
      }
      if (note_status === "entregado" && !note.deliveredAt) {
        note.deliveredAt = new Date();
        note.cleaning_status = "entregado";
        if (note.phoneNumber) {
          try {
            const formattedDate = moment(note.deliveredAt).format("DD/MM/YYYY - HH:mm") + " hrs";
            const components = [
              {
                type: "body",
                parameters: [
                  { type: "text", text: note.name || "Cliente" },
                  { type: "text", text: note.folio },
                  { type: "text", text: `$${note.total.toFixed(2)}` },
                  { type: "text", text: formattedDate },
                ],
              },
              {
                type: "button",
                sub_type: "flow",
                index: "0",
                parameters: [{ type: "payload", payload: "9730613807037945" }],
              },
            ];
            await sendWhatsAppMessage({
              to: note.phoneNumber.startsWith("52") ? note.phoneNumber : `52${note.phoneNumber}`,
              templateName: "testing",
              components,
            });
          } catch (whatsErr) {
            console.error("Error enviando WhatsApp:", whatsErr.message);
            note.whatsappError = whatsErr.message;
          }
        }
      }
      note.note_status = note_status;
    }

    if (abonos && Array.isArray(abonos)) {
      note.abonos = [...(note.abonos || []), ...abonos];
    }

    const updatedNote = await note.save();
    console.log("Emitting noteUpdated:", { businessId, data: updatedNote.toObject() });
    req.io?.emit("noteUpdated", {
      businessId,
      event: "noteUpdated",
      data: updatedNote.toObject(),
    });
    res.json({ success: true, message: "Pago actualizado", data: updatedNote });
  } catch (error) {
    console.error("Error al actualizar pago:", {
      message: error.message,
      stack: error.stack,
      noteId: req.params.id,
      businessId,
    });
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/:id", auth, isBusinessOwner, validateNote, async (req, res) => {
  try {
    const note = await LaundryNote.findOne({ _id: req.params.id, businessId: req.body.businessId });
    if (!note) {
      return res.status(404).json({ success: false, message: "nota no encontrada" });
    }

    const restrictedFields = ['note_status', 'abonos', 'paidAt', 'deliveredAt', 'payment_method'];
    const updateData = { ...req.body };
    restrictedFields.forEach((field) => delete updateData[field]);

    Object.assign(note, updateData);
    const updatedNote = await note.save();
    console.log("Emitting noteUpdated:", { businessId: req.body.businessId, data: updatedNote.toObject() });
    req.io?.emit("noteUpdated", {
      businessId: req.body.businessId,
      event: "noteUpdated",
      data: updatedNote.toObject(),
    });
    res.json({ success: true, message: "nota actualizada", data: updatedNote });
  } catch (error) {
    console.error("Error al actualizar nota:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/", auth, isBusinessOwner, async (req, res) => {
  try {
    const businessId = req.businessId;
    console.log("GET /api/notes - businessId:", businessId);
    const notes = await LaundryNote.find({ businessId }).sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error("Error al obtener notas:", error);
    res.status(400).json({ success: false, message: "Error al obtener notas" });
  }
});

router.get("/:id", auth, isBusinessOwner, async (req, res) => {
  try {
    const note = await LaundryNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: "nota no encontrada" });
    }
    if (!note.businessId.equals(req.businessId) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "No autorizado" });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    console.error("Error al obtener nota:", error);
    res.status(400).json({ success: false, message: "Error al obtener nota" });
  }
});

router.delete("/:id", auth, isBusinessOwner, async (req, res) => {
  try {
    const note = await LaundryNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: "nota no encontrada" });
    }
    if (!note.businessId.equals(req.businessId) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "No autorizado" });
    }
    await LaundryNote.deleteOne({ _id: req.params.id });
    console.log("Emitting noteDeleted:", { businessId: note.businessId, data: note.toObject() });
    req.io?.emit("noteDeleted", {
      businessId: note.businessId,
      event: "noteDeleted",
      data: note.toObject(),
    });
    res.json({ success: true, message: "nota eliminada", data: { noteId: note._id } });
  } catch (error) {
    console.error("Error al eliminar nota:", error);
    res.status(400).json({ success: false, message: "Error al eliminar nota" });
  }
});

router.get("/stats/month", auth, isBusinessOwner, async (req, res) => {
  try {
    const businessId = req.businessId;
    console.log("GET /api/notes/stats/month - businessId:", businessId);
    const monthStats = await LaundryNote.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);
    console.log("Emitting statsUpdated for notes:", { businessId, data: { type: "notes", monthStats } });
    req.io?.emit("statsUpdated", {
      businessId,
      event: "statsUpdated",
      data: { type: "notes", monthStats },
    });
    res.json({ success: true, data: monthStats });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(400).json({ success: false, message: "Error al obtener estadísticas" });
  }
});

router.get("/stats/income", auth, isBusinessOwner, async (req, res) => {
  try {
    const businessId = req.businessId;
    console.log("GET /api/notes/stats/income - businessId:", businessId);
    const incomeStats = await LaundryNote.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          total: { $sum: "$total" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);
    console.log("Emitting statsUpdated for income:", { businessId, data: { type: "income", incomeStats } });
    req.io?.emit("statsUpdated", {
      businessId,
      event: "statsUpdated",
      data: { type: "income", incomeStats },
    });
    res.json({ success: true, data: incomeStats });
  } catch (error) {
    console.error("Error al obtener ingresos:", error);
    res.status(400).json({ success: false, message: "Error al obtener ingresos" });
  }
});

module.exports = router;