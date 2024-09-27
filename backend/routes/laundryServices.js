const express = require('express');
const router = express.Router();
const LaundryService = require('../models/LaundryService');

// Ruta para obtener todos los servicios de lavandería
router.get('/', async (req, res) => {
  try {
    const services = await LaundryService.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
