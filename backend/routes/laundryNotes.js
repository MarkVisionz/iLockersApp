const { LaundryNote } = require("../models/laundryNote");

const express = require("express");

const router = express.Router();

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
      note_status
    });

    const savedLaundryNote = await laundryNote.save();

    res.status(200).send(savedLaundryNote);
  } catch (error) {
    res.status(500).send(error);
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

module.exports = router;
