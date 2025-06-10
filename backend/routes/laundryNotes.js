const { LaundryNote } = require("../models/laundryNote");
const express = require("express");
const router = express.Router();
const moment = require("moment");
const { sendWhatsAppMessage } = require("../utils/sendWhatsapp");

// Helper to emit stats updates
const emitStatsUpdate = async (req, type = "both") => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYYY-MM-DD HH:mm:ss");
  try {
    const stats = {};
    if (type === "notes" || type === "both") {
      stats.notes = await LaundryNote.aggregate([
        { $match: { createdAt: { $gte: new Date(previousMonth) } } },
        { $project: { month: { $month: "$createdAt" } } },
        { $group: { _id: "$month", total: { $sum: 1 } } },
      ]);
    }
    if (type === "income" || type === "both") {
      stats.income = await LaundryNote.aggregate([
        { $match: { createdAt: { $gte: new Date(previousMonth) } } },
        { $project: { month: { $month: "$createdAt" }, total: "$total" } },
        { $group: { _id: "$month", total: { $sum: "$total" } } },
      ]);
    }
    if (req.io) {
      if (stats.notes) {
        console.log("Emitting laundryStatsUpdated: notes", stats.notes);
        req.io.emit("laundryStatsUpdated", { type: "notes", data: stats.notes });
      }
      if (stats.income) {
        console.log("Emitting laundryStatsUpdated: income", stats.income);
        req.io.emit("laundryStatsUpdated", { type: "income", data: stats.income });
      }
    }
  } catch (err) {
    console.error("Error emitting stats:", err.message);
  }
};

// ✅ CREATE A NOTE
router.post("/", async (req, res) => {
  const {
    name,
    folio,
    date,
    services,
    observations,
    abonos,
    suavitelDesired,
    total,
    note_status,
    cleaning_status,
    paidAt,
    deliveredAt,
    phoneNumber,
    method,
  } = req.body;

  try {
    const laundryNote = new LaundryNote({
      name,
      folio,
      date,
      services,
      observations,
      abonos: Array.isArray(abonos) ? abonos : [],
      suavitelDesired,
      total,
      note_status: note_status || "pendiente",
      cleaning_status: cleaning_status || "sucia",
      paidAt,
      deliveredAt,
      phoneNumber,
      method: note_status === "pagado" ? method : null,
    });

    const savedLaundryNote = await laundryNote.save();

    // ✅ Enviar mensaje WhatsApp si hay número válido
    if (phoneNumber) {
      const totalAbonos = (abonos || []).reduce(
        (sum, ab) => sum + ab.amount,
        0
      );
      const pendiente = total - totalAbonos;

      const unitMap = {
        lavado: "kg",
        secadora: "kg",
        promomartes: "kg",
        hamaca: "pza",
        cubrecolchon: "pza",
        "toallas/sabanas": "kg",
        "cortinas/manteles": "kg",
        tennis: "pza",
        lavadoexpress: "kg",
        extras: "shot",
        edredon: "pza",
        almohada: "pza",
        cobija: "pza",
      };

      const formatServiceName = (str) =>
        str
          .replace(/_/g, " ")
          .replace(/-/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const formatServicesToText = (services) => {
        return Object.entries(services)
          .flatMap(([serviceName, data]) => {
            const unit = unitMap[serviceName.toLowerCase()] || "";
            const formattedName = formatServiceName(serviceName);

            // Caso 1: servicio con tallas (anidado)
            if (typeof data === "object" && !("quantity" in data)) {
              return Object.entries(data).map(([subtype, val]) => {
                const qty = val.quantity || 0;
                const price = val.unitPrice || 0;
                const total = (qty * price).toFixed(2);
                if (qty > 0) {
                  return `• ${formattedName} (${formatServiceName(
                    subtype
                  )}): ${qty} ${unit} x $${price} = $${total}`;
                }
                return null;
              });
            }

            // Caso 2: servicio simple
            if (data?.quantity > 0) {
              const qty = data.quantity;
              const price = data.unitPrice || 0;
              const total = (qty * price).toFixed(2);
              return `• ${formattedName}: ${qty} ${unit} x $${price} = $${total}`;
            }

            return null;
          })
          .filter(Boolean)
          .join(", ");
      };

      const serviciosTexto = formatServicesToText(services);

      const components = [
        {
          type: "body",
          parameters: [
            { type: "text", text: name || "Cliente" },
            { type: "text", text: folio },
            { type: "text", text: serviciosTexto || "Sin servicios" },
            { type: "text", text: `$${total.toFixed(2)}` },
            { type: "text", text: phoneNumber },
          ],
        },
      ];

      try {
        await sendWhatsAppMessage({
          to: phoneNumber.startsWith("52") ? phoneNumber : `52${phoneNumber}`,
          templateName: "nueva_nota",
          components,
        });
        console.log("✅ WhatsApp enviado: nueva_nota");
      } catch (whatsErr) {
        console.error(
          "❌ Error al enviar WhatsApp:",
          whatsErr.response?.data || whatsErr.message
        );
        savedLaundryNote.whatsappError =
          whatsErr.response?.data?.error?.message || whatsErr.message;
      }
    }

    if (req.io) {
      console.log("Emitting noteCreated:", savedLaundryNote._id, savedLaundryNote.folio);
      req.io.emit("noteCreated", savedLaundryNote);
      await emitStatsUpdate(req, "both");
    }

    res.status(200).send(savedLaundryNote);
  } catch (error) {
    console.error("Error saving laundry note:", error.message);
    res.status(500).send({ message: error.message });
  }
});

// ✅ EDIT NOTE
router.put("/:id", async (req, res) => {
  try {
    console.log("PUT /notes/:id called:", {
      id: req.params.id,
      body: req.body,
    });

    const note = await LaundryNote.findById(req.params.id);
    if (!note) {
      console.log("Note not found for ID:", req.params.id);
      return res.status(404).send("Note not found...");
    }

    const { note_status, cleaning_status, newAbono, method } = req.body;

    // ✅ Actualizar status de pago
    if (note_status) {
      console.log("Updating note_status to:", note_status);
      if (note_status === "pagado" && note.note_status !== "pendiente") {
        return res
          .status(400)
          .send("La nota debe estar Pendiente para marcar como Pagada.");
      }
      if (note_status === "entregado" && note.note_status !== "pagado") {
        return res
          .status(400)
          .send("La nota debe estar Pagada para marcar como Entregada.");
      }
      if (note_status === "pagado") {
        const totalAbonado =
          (note.abonos || []).reduce((acc, ab) => acc + ab.amount, 0) +
          (newAbono ? newAbono.amount : 0);
        if (totalAbonado < note.total) {
          return res
            .status(400)
            .send(`Falta pagar $${(note.total - totalAbonado).toFixed(2)}.`);
        }
        if (!note.paidAt) {
          note.paidAt = new Date();
          note.method = method || note.method;
        }
      }
      if (note_status === "entregado" && !note.deliveredAt) {
        note.deliveredAt = new Date();
        note.cleaning_status = "entregado"; // Actualizar cleaning_status

        // ✅ Enviar WhatsApp con botón de confirmación (Flow)
        if (note.phoneNumber) {
          try {
            const formattedDate =
              moment(note.deliveredAt).format("DD/MM/YYYY - HH:mm") + " hrs";

            const components = [
              {
                type: "body",
                parameters: [
                  { type: "text", text: note.name || "Cliente" },             // {{1}} Nombre
                  { type: "text", text: note.folio },                         // {{2}} Folio
                  { type: "text", text: `$${note.total.toFixed(2)}` },        // {{3}} Total
                  { type: "text", text: formattedDate },                      // {{4}} Fecha y hora
                ],
              },
              {
                type: "button",
                sub_type: "flow",
                index: "0",
                parameters: [
                  {
                    type: "payload",
                    payload: "9730613807037945", // ✅ como string
                  },
                ],
              },
            ];

            await sendWhatsAppMessage({
              to: note.phoneNumber.startsWith("52")
                ? note.phoneNumber
                : `52${note.phoneNumber}`,
              templateName: "testing", // <- tu template con botón
              components,
            });

            console.log("✅ WhatsApp con Flow enviado: testing");
          } catch (whatsErr) {
            console.error(
              "❌ Error enviando WhatsApp con Flow:",
              whatsErr.response?.data || whatsErr.message
            );
            note.whatsappError =
              whatsErr.response?.data?.error?.message || whatsErr.message;
          }
        }
      }

      note.note_status = note_status;
    }

    // ✅ Actualizar status de limpieza
    if (cleaning_status) {
      console.log("Updating cleaning_status to:", cleaning_status);
      note.cleaning_status = cleaning_status;
    }

    if (
      cleaning_status === "listo_para_entregar" &&
      note.phoneNumber &&
      note.cleaning_status !== "entregado"
    ) {
      try {
        const totalAbonos = (note.abonos || []).reduce(
          (sum, ab) => sum + ab.amount,
          0
        );
        const pendiente = note.total - totalAbonos;
        const estatus = note.note_status === "pagado" ? "Pagado" : "Pendiente";

        const components = [
          {
            type: "body",
            parameters: [
              { type: "text", text: note.name || "Cliente" },
              { type: "text", text: note.folio },
              { type: "text", text: estatus },
            ],
          },
        ];

        // Si abonó algo, mostramos los campos opcionales
        if (totalAbonos > 0) {
          components[0].parameters.push(
            { type: "text", text: `$${totalAbonos.toFixed(2)}` },
            { type: "text", text: `$${pendiente.toFixed(2)}` }
          );
        } else {
          // Si no abonó, manda guiones
          components[0].parameters.push(
            { type: "text", text: "-" },
            { type: "text", text: "-" }
          );
        }

        components[0].parameters.push({
          type: "text",
          text: `$${note.total.toFixed(2)}`,
        });

        await sendWhatsAppMessage({
          to: note.phoneNumber.startsWith("52")
            ? note.phoneNumber
            : `52${note.phoneNumber}`,
          templateName: "ropa_lista",
          components,
        });

        console.log("✅ WhatsApp enviado: ropa_lista");
      } catch (whatsErr) {
        console.error(
          "❌ Error enviando WhatsApp:",
          whatsErr.response?.data || whatsErr.message
        );
        note.whatsappError =
          whatsErr.response?.data?.error?.message || whatsErr.message;
      }
    }

    // ✅ Agregar abono si existe
    if (newAbono && newAbono.amount && newAbono.method) {
      note.abonos.push({
        amount: newAbono.amount,
        method: newAbono.method,
        date: newAbono.date || new Date(),
      });
    }

    const updatedNote = await note.save();
    console.log("Note updated:", updatedNote);

    if (req.io) {
      console.log(
        "Emitting noteUpdated:",
        updatedNote._id,
        updatedNote.folio
      );
      req.io.emit("noteUpdated", updatedNote.toJSON());
      await emitStatsUpdate(req, "both");
    } else {
      console.error("Socket.IO not available (req.io undefined)");
    }

    res.status(200).send(updatedNote);
  } catch (err) {
    console.error("Error updating note:", err.message);
    res.status(500).send(err);
  }
});

// GET ALL NOTES
router.get("/", async (req, res) => {
  try {
    const notes = await LaundryNote.find();
    res.status(200).send(notes);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// DELETE NOTE
router.delete("/:id", async (req, res) => {
  try {
    const note = await LaundryNote.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found...");

    const deletedNote = await LaundryNote.findByIdAndDelete(req.params.id);

    if (req.io) {
      console.log("Emitting noteDeleted:", deletedNote._id, deletedNote.folio);
      req.io.emit("noteDeleted", deletedNote);
      await emitStatsUpdate(req, "both");
    }

    res.status(200).send(deletedNote);
  } catch (error) {
    res.status(500).send(error);
  }
});

// POST /api/notes/validate-password
router.post("/validate-password", (req, res) => {
  const { password } = req.body;
  const isValid = password === process.env.ADMIN_PASSWORD;
  return res.status(200).json({ valid: isValid });
});

// GET NOTE BY ID
router.get("/findOne/:id", async (req, res) => {
  try {
    const note = await LaundryNote.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found...");
    res.status(200).send(note);
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET INCOME STATS
router.get("/income/stats", async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYYY-MM-DD HH:mm:ss");

  try {
    const income = await LaundryNote.aggregate([
      { $match: { createdAt: { $gte: new Date(previousMonth) } } },
      {
        $project: {
          month: { $month: "$createdAt" },
          total: "$total",
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$total" },
        },
      },
    ]);

    if (req.io) {
      console.log("Emitting laundryStatsUpdated: income", income);
      req.io.emit("laundryStatsUpdated", { type: "income", data: income });
    }

    res.status(200).send(income);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// GET NOTES STATS
router.get("/stats", async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYYY-MM-DD HH:mm:ss");

  try {
    const notes = await LaundryNote.aggregate([
      { $match: { createdAt: { $gte: new Date(previousMonth) } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);

    if (req.io) {
      console.log("Emitting laundryStatsUpdated: notes", notes);
      req.io.emit("laundryStatsUpdated", { type: "notes", data: notes });
    }

    res.status(200).send(notes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

module.exports = router;