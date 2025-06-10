// routes/business.js
const express = require("express");
const router = express.Router();
const Business = require("../models/business");
const { verifyToken } = require("../middleware/verifyToken");

// Crear un nuevo negocio
router.post("/", verifyToken, async (req, res) => {
  try {
    const newBusiness = new Business({
      ...req.body,
      ownerId: req.user._id,
    });
    const savedBusiness = await newBusiness.save();
    res.status(201).json(savedBusiness);
  } catch (err) {
    res.status(500).json({ error: "Error al crear negocio", details: err });
  }
});

// Obtener negocios del usuario actual
router.get("/", verifyToken, async (req, res) => {
  try {
    const businesses = await Business.find({ ownerId: req.user._id });
    res.status(200).json(businesses);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener negocios", details: err });
  }
});

// Obtener un negocio por ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: "Negocio no encontrado" });
    res.status(200).json(business);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener negocio", details: err });
  }
});

// Editar info del negocio
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updated = await Business.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar negocio", details: err });
  }
});

module.exports = router;
