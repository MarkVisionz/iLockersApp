const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Service = require("../models/laundryServices");

// Middleware de validación
const validateService = (req, res, next) => {
  console.log("Payload recibido:", JSON.stringify(req.body, null, 2));

  if (req.body.type === "simple") {
    req.body.sizes = undefined;
    if (
      req.body.price === undefined ||
      req.body.price === null ||
      req.body.price < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "El precio es requerido y debe ser no negativo para servicios simples",
      });
    }
    req.body.price = Number(req.body.price);
  } else if (req.body.type === "sized") {
    req.body.price = undefined;
    if (!req.body.sizes || req.body.sizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe agregar al menos una talla para servicios con tallas",
      });
    }

    req.body.sizes = req.body.sizes.map((size) => ({
      id: size.id || new mongoose.Types.ObjectId().toString(),
      name: size.name?.trim(),
      price: Number(size.price),
    }));
  }

  if (req.body.availableDays && !Array.isArray(req.body.availableDays)) {
    return res.status(400).json({
      success: false,
      message: "availableDays debe ser un array",
    });
  }

  next();
};

// GET Fetch Services
router.get("/", async (req, res) => {
  try {
    const { search = "", type = "" } = req.query;
    const query = {};

    if (search) query.name = { $regex: search, $options: "i" };
    if (type) query.type = type;

    const services = await Service.find(query).sort({ createdAt: 1 }).lean();

    res.json({ success: true, data: services });
  } catch (error) {
    console.error("Error en GET /api/services:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los servicios",
      error: error.message,
    });
  }
});

// GET Fetch ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "ID de servicio no válido" });
    }

    const service = await Service.findById(req.params.id).lean();

    if (!service) {
      return res.status(404).json({ success: false, message: "Servicio no encontrado" });
    }

    res.json({ success: true, message: "Servicio obtenido exitosamente", data: service });
  } catch (error) {
    console.error("Error en GET /api/services/:id:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el servicio",
      error: error.message,
    });
  }
});

// POST /api/services
// Create Service
router.post("/", validateService, async (req, res) => {
  try {

    const service = new Service(req.body);
    await service.save();

    req.io.emit("serviceCreated", service);

    res.status(201).json({
      success: true,
      message: "Servicio creado exitosamente",
      data: service,
    });
  } catch (error) {
    console.error("Error en POST /api/services:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: "Error de validación", errors });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un servicio con ese nombre",
        error: error.message,
      });
    }

    res.status(500).json({ success: false, message: "Error al crear el servicio", error: error.message });
  }
});

// Create Bulk
router.post("/bulk", async (req, res) => {
  try {
    const services = req.body.services;

    if (!Array.isArray(services)) {
      return res.status(400).json({ success: false, message: "Se espera un array de servicios." });
    }

    const created = await Service.insertMany(services);

    req.io.emit("servicesBulkCreated", created); // Puedes emitir todos o simplemente un trigger

    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (error) {
    console.error("Error en POST /services/bulk:", error);
    res.status(500).json({ success: false, message: "Error al subir servicios masivos", error: error.message });
  }
});


// PUT /api/services/:id
//Edit Service ID
router.put("/:id", validateService, async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "ID de servicio no válido" });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };
    const options = { new: true, runValidators: true, context: "query" };

    const service = await Service.findByIdAndUpdate(req.params.id, updateData, options);

    if (!service) {
      return res.status(404).json({ success: false, message: "Servicio no encontrado" });
    }

    req.io.emit("serviceUpdated", service);

    res.json({
      success: true,
      message: "Servicio actualizado exitosamente",
      data: service,
    });
  } catch (error) {
    console.error("Error en PUT /api/services/:id:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: "Error de validación", errors });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un servicio con ese nombre",
        error: error.message,
      });
    }

    res.status(500).json({ success: false, message: "Error al actualizar el servicio", error: error.message });
  }
});

// DELETE /api/services/:id
router.delete("/:id", async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "ID de servicio no válido" });
    }

    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: "Servicio no encontrado" });
    }

    req.io.emit("serviceDeleted", service);

    res.json({
      success: true,
      message: "Servicio eliminado exitosamente",
      data: { _id: req.params.id },
    });
  } catch (error) {
    console.error("Error en DELETE /api/services/:id:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el servicio",
      error: error.message,
    });
  }
});

// DELETE /api/services (todos)
router.delete("/", async (req, res) => {
  try {
    const result = await Service.deleteMany({});

    req.io.emit("servicesCleared");
    
    res.json({
      success: true,
      message: "Todos los servicios eliminados exitosamente",
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("Error en DELETE /api/services:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar todos los servicios",
      error: error.message,
    });
  }
});

// Middleware de errores
router.use((err, req, res, next) => {
  console.error("Error middleware:", err.stack);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = router;
