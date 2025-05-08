const { LaundryNote } = require("../models/laundryNote");
const express = require("express");
const router = express.Router();
const moment = require("moment");

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

    if (req.io) {
      req.io.emit("noteCreated", savedLaundryNote);
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
    console.log("PUT /notes/:id called:", { id: req.params.id, body: req.body });

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
        return res.status(400).send("La nota debe estar Pendiente para marcar como Pagada.");
      }
      if (note_status === "entregado" && note.note_status !== "pagado") {
        return res.status(400).send("La nota debe estar Pagada para marcar como Entregada.");
      }
      if (note_status === "pagado") {
        const totalAbonado = (note.abonos || []).reduce((acc, ab) => acc + ab.amount, 0) + (newAbono ? newAbono.amount : 0);
        if (totalAbonado < note.total) {
          return res.status(400).send(`Falta pagar $${(note.total - totalAbonado).toFixed(2)}.`);
        }
        if (!note.paidAt) {
          note.paidAt = new Date();
          note.method = method || note.method;
        }
      }
      if (note_status === "entregado" && !note.deliveredAt) {
        note.deliveredAt = new Date();
        note.cleaning_status = "entregado"; // Actualizar cleaning_status
      }
      note.note_status = note_status;
    }

    // ✅ Actualizar status de limpieza
    if (cleaning_status) {
      console.log("Updating cleaning_status to:", cleaning_status);
      note.cleaning_status = cleaning_status;
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
      console.log("Emitting noteUpdated:", JSON.stringify(updatedNote, null, 2));
      req.io.emit("noteUpdated", updatedNote.toJSON());
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
      req.io.emit("noteDeleted", deletedNote);
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
      req.io.emit("laundryStatsUpdated", { type: "notes", data: notes });
    }

    res.status(200).send(notes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

module.exports = router;