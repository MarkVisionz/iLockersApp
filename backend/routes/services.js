const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Service = require('../models/laundryServices');
const Business = require('../models/business');
const { auth, isBusinessOwner } = require('../middleware/auth');

// Utilidad de validación para creación/edición de servicios
const validateService = (req, res, next) => {
  const services = Array.isArray(req.body.services) ? req.body.services : [req.body];

  for (const service of services) {
    // Validar businessId
    if (!service.businessId || !mongoose.Types.ObjectId.isValid(service.businessId)) {
      return res.status(400).json({ success: false, message: 'El ID del negocio es requerido y debe ser válido', code: 'INVALID_BUSINESS_ID' });
    }

    // Validar nombre
    if (!service.name || service.name.trim().length < 3 || service.name.length > 50) {
      return res.status(400).json({ success: false, message: 'El nombre debe tener entre 3 y 50 caracteres', code: 'INVALID_NAME' });
    }

    // Validar tipo
    if (!['simple', 'sized'].includes(service.type)) {
      return res.status(400).json({ success: false, message: 'Tipo de servicio inválido', code: 'INVALID_TYPE' });
    }

    // Validaciones específicas según tipo
    if (service.type === 'simple') {
      service.sizes = undefined;
      if (service.price === undefined || service.price === null || service.price < 0) {
        return res.status(400).json({ success: false, message: 'El precio es requerido y debe ser no negativo para servicios simples', code: 'INVALID_PRICE' });
      }
      service.price = Number(service.price);
    } else if (service.type === 'sized') {
      service.price = undefined;
      if (!service.sizes || !Array.isArray(service.sizes) || service.sizes.length === 0) {
        return res.status(400).json({ success: false, message: 'Debe agregar al menos una talla', code: 'INVALID_SIZES' });
      }
      service.sizes = service.sizes.map(size => ({
        id: size.id || new mongoose.Types.ObjectId().toString(),
        name: size.name?.trim(),
        price: Number(size.price),
      }));
    }

    // Validar días disponibles (0-6)
    if (service.availableDays && (!Array.isArray(service.availableDays) || service.availableDays.some(day => !Number.isInteger(day) || day < 0 || day > 6))) {
      return res.status(400).json({ success: false, message: 'availableDays debe ser un arreglo de números entre 0 y 6', code: 'INVALID_AVAILABLE_DAYS' });
    }

    // Validar categoría
    if (service.category && !['lavado', 'planchado', 'tintorería', 'otro'].includes(service.category)) {
      return res.status(400).json({ success: false, message: 'Categoría inválida', code: 'INVALID_CATEGORY' });
    }

    // Validar descripción
    if (service.description && service.description.length > 200) {
      return res.status(400).json({ success: false, message: 'La descripción no puede exceder los 200 caracteres', code: 'INVALID_DESCRIPTION' });
    }
  }

  next();
};

// Obtener todos los servicios de un negocio con filtros opcionales
router.get('/', auth, isBusinessOwner, async (req, res) => {
  try {
    const businessId = req.businessId;
    console.log("GET /api/services - businessId:", businessId);
    const { search = '', type = '' } = req.query;
    const query = { businessId: new mongoose.Types.ObjectId(businessId) };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (type) query.type = type;

    const services = await Service.find(query).sort({ createdAt: 1 }).lean();
    console.log("Servicios encontrados:", services.length, services.map(service => ({ _id: service._id, name: service.name, businessId: service.businessId })));
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Error al obtener servicios:', error.message);
    res.status(500).json({ success: false, message: 'Error al obtener servicios', code: 'SERVER_ERROR' });
  }
});

// Obtener un servicio específico por ID
router.get('/:id', auth, isBusinessOwner, async (req, res) => {
  try {
    const businessId = req.businessId;
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({ success: false, message: 'ID inválido', code: 'INVALID_ID' });
    }
    const service = await Service.findOne({ _id: req.params.id, businessId }).lean();
    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado', code: 'SERVICE_NOT_FOUND' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Error al obtener servicio:', error.message);
    res.status(500).json({ success: false, message: 'Error al obtener el servicio', code: 'SERVER_ERROR' });
  }
});

// Crear un nuevo servicio
router.post('/', auth, isBusinessOwner, validateService, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const service = new Service({
      ...req.body,
      businessId: req.businessId,
    });
    await service.save({ session });

    // Actualizar la colección Business
    const business = await Business.findById(req.businessId).session(session);
    if (!business) {
      throw new Error('Negocio no encontrado');
    }
    business.services.push(service._id);
    await business.save({ session });

    await session.commitTransaction();
    req.io?.emit('serviceCreated', { ...service.toObject(), businessId: req.businessId });
    res.status(201).json({ success: true, message: 'Servicio creado', data: service });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error al crear servicio:', error.message);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Error de validación', code: 'VALIDATION_ERROR', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Nombre de servicio duplicado', code: 'DUPLICATE_NAME' });
    }
    res.status(500).json({ success: false, message: 'Error al crear servicio', code: 'SERVER_ERROR' });
  } finally {
    session.endSession();
  }
});

// Crear múltiples servicios (bulk)
router.post('/bulk', auth, isBusinessOwner, async (req, res) => {
  let session;
  try {
    const services = req.body.services;
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: 'Se requiere un arreglo de servicios', code: 'INVALID_SERVICES' });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const validated = services.map(service => ({
      ...service,
      businessId: req.businessId,
      category: ['lavado', 'planchado', 'tintorería', 'otro'].includes(service.category) ? service.category : 'otro',
    }));

    const created = await Service.insertMany(validated, { session });

    // Actualizar la colección Business
    const business = await Business.findById(req.businessId).session(session);
    if (!business) {
      throw new Error('Negocio no encontrado');
    }
    business.services.push(...created.map(s => s._id));
    await business.save({ session });

    await session.commitTransaction();
    req.io?.emit('servicesBulkCreated', created.map(s => ({ ...s.toObject(), businessId: req.businessId })));
    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (error) {
    if (session?.inTransaction()) await session.abortTransaction();
    console.error('Error al crear bulk:', error.message);
    res.status(500).json({ success: false, message: 'Error al crear servicios masivos', code: 'SERVER_ERROR' });
  } finally {
    session?.endSession();
  }
});

// Actualizar un servicio existente
router.put('/:id', auth, isBusinessOwner, validateService, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID inválido', code: 'INVALID_ID' });
    }
    const updateData = { ...req.body, updatedAt: Date.now() };
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado', code: 'SERVICE_NOT_FOUND' });
    }
    req.io?.emit('serviceUpdated', { ...service.toObject(), businessId: req.businessId });
    res.json({ success: true, message: 'Servicio actualizado', data: service });
  } catch (error) {
    console.error('Error al actualizar servicio:', error.message);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Error de validación', code: 'VALIDATION_ERROR', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Nombre de servicio duplicado', code: 'DUPLICATE_NAME' });
    }
    res.status(500).json({ success: false, message: 'Error al actualizar servicio', code: 'SERVER_ERROR' });
  }
});

// Eliminar un servicio específico
router.delete('/:id', auth, isBusinessOwner, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const businessId = req.businessId;
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error('ID inválido');
    }
    const service = await Service.findOneAndDelete({ _id: req.params.id, businessId }).session(session);
    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    // Actualizar la colección Business
    await Business.findByIdAndUpdate(
      businessId,
      { $pull: { services: req.params.id } },
      { session }
    );

    await session.commitTransaction();
    req.io?.emit('serviceDeleted', { ...service.toObject(), businessId });
    res.json({ success: true, message: 'Servicio eliminado', data: { _id: req.params.id } });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error al eliminar servicio:', error.message);
    res.status(error.message === 'Servicio no encontrado' ? 404 : 500).json({
      success: false,
      message: error.message || 'Error al eliminar servicio',
      code: error.message === 'Servicio no encontrado' ? 'SERVICE_NOT_FOUND' : 'SERVER_ERROR',
    });
  } finally {
    session.endSession();
  }
});

// Eliminar todos los servicios de un negocio
router.delete('/', auth, isBusinessOwner, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const businessId = req.businessId;
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error('El ID del negocio es requerido y debe ser válido');
    }
    const result = await Service.deleteMany({ businessId }).session(session);

    // Actualizar la colección Business
    await Business.findByIdAndUpdate(
      businessId,
      { $set: { services: [] } },
      { session }
    );

    await session.commitTransaction();
    req.io?.emit('servicesCleared', { businessId });
    res.json({ success: true, message: 'Todos los servicios eliminados', data: { deletedCount: result.deletedCount } });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error al eliminar servicios:', error.message);
    res.status(500).json({ success: false, message: 'Error al eliminar servicios', code: 'SERVER_ERROR' });
  } finally {
    session.endSession();
  }
});

module.exports = router;