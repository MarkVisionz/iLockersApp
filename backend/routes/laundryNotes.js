const { LaundryNote } = require("../models/laundryNote");
const express = require("express");
const router = express.Router();
const moment = require("moment");

// CREATE A NOTE
router.post("/", async (req, res) => {
  const {
    name,
    folio,
    date,
    services,
    observations,
    abono,
    suavitelDesired,
    total,
    note_status,
    cleaning_status,
    paidAt,
    deliveredAt,
    phoneNumber,
  } = req.body;

  try {
    const laundryNote = new LaundryNote({
      name,
      folio,
      date,
      services,
      observations,
      abono,
      suavitelDesired,
      total,
      note_status: note_status || "pendiente",
      cleaning_status: cleaning_status || "sucia",
      paidAt,
      deliveredAt,
      phoneNumber,
    });

    const savedLaundryNote = await laundryNote.save();

    // ✅ Emitir evento de nota creada
    if (req.io) {
      req.io.emit("noteCreated", savedLaundryNote);
    }

    res.status(200).send(savedLaundryNote);
  } catch (error) {
    console.error("Error saving laundry note:", error.message);
    res.status(500).send({ message: error.message });
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
    res.status(200).send(deletedNote);
  } catch (error) {
    res.status(500).send(error);
  }
});

// POST /api/notes/validate-password
router.post("/validate-password", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ valid: true });
  } else {
    return res.status(200).json({ valid: false });
  }
});


// EDIT NOTE
router.put("/:id", async (req, res) => {
  try {
    const note = await LaundryNote.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found...");

    const { note_status, cleaning_status } = req.body;

    if (note_status) {
      if (note_status === "pagado" && !note.paidAt) {
        note.paidAt = new Date();
      }
      if (note_status === "entregado" && !note.deliveredAt) {
        note.deliveredAt = new Date();
      }
      note.note_status = note_status;
    }

    if (cleaning_status) {
      note.cleaning_status = cleaning_status;
    }

    const updatedNote = await note.save();

    // ✅ Emitir evento de nota actualizada
    if (req.io) {
      req.io.emit("noteUpdated", updatedNote);
    }

    res.status(200).send(updatedNote);
  } catch (err) {
    res.status(500).send(err);
  }
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
      {
        $match: { createdAt: { $gte: new Date(previousMonth) } },
      },
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
      {
        $match: { createdAt: { $gte: new Date(previousMonth) } },
      },
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

    res.status(200).send(notes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

module.exports = router;
