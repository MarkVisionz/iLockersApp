const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { auth, isBusinessOwner } = require("../middleware/auth");
const Business = require("../models/business");
const User = require("../models/user");
const LaundryNote = require("../models/laundryNote");
const Service = require("../models/laundryServices");

const validateBusiness = (req, res, next) => {
  console.log("Validating business data:", JSON.stringify(req.body, null, 2));

  const {
    name,
    email,
    phone,
    address,
    businessHours,
    description,
    logo,
    ownerId,
    settings,
  } = req.body;

  // Validate ownerId for POST requests
  if (req.method === 'POST' && (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId))) {
    console.log("Validation failed: Invalid ownerId");
    return res.status(400).json({
      success: false,
      message: "OwnerId inválido",
      code: "INVALID_OWNER",
    });
  }

  // Validate name
  if (name && (typeof name !== "string" || name.length < 3 || name.length > 100)) {
    console.log("Validation failed: Invalid name");
    return res.status(400).json({
      success: false,
      message: "Nombre inválido",
      code: "INVALID_NAME",
    });
  }

  // Validate email
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log("Validation failed: Invalid email");
    return res.status(400).json({
      success: false,
      message: "Correo inválido",
      code: "INVALID_EMAIL",
    });
  }

  // Validate phone (optional)
  if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/[\s\-()]/g, ""))) {
    console.log("Validation failed: Invalid phone");
    return res.status(400).json({
      success: false,
      message: "Teléfono inválido",
      code: "INVALID_PHONE",
    });
  }

  // Validate address
  if (address && (
    !address.street ||
    !address.city ||
    !address.state ||
    !address.postalCode
  )) {
    console.log("Validation failed: Invalid address");
    return res.status(400).json({
      success: false,
      message: "Dirección incompleta",
      code: "INVALID_ADDRESS",
    });
  }

  // Validate business hours
  if (businessHours) {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    for (const day of days) {
      const hours = businessHours[day];
      if (hours) {
        if (hours.isClosed) {
          continue;
        }
        if (!hours.isClosed) {
          if (!hours.open || !hours.close) {
            console.log(`Validation failed: Missing hours for ${day}`);
            return res.status(400).json({
              success: false,
              message: `Se requieren horarios de apertura y cierre para ${day} o marcar como cerrado`,
              code: "INVALID_HOURS",
            });
          }
          if (hours.open && !/^([0-1]\d|2[0-3]):[0-5]\d$/.test(hours.open)) {
            console.log(`Validation failed: Invalid open time format for ${day}`);
            return res.status(400).json({
              success: false,
              message: `Formato de hora de apertura inválido para ${day}`,
              code: "INVALID_HOURS",
            });
          }
          if (hours.close && !/^([0-1]\d|2[0-3]):[0-5]\d$/.test(hours.close)) {
            console.log(`Validation failed: Invalid close time format for ${day}`);
            return res.status(400).json({
              success: false,
              message: `Formato de hora de cierre inválido para ${day}`,
              code: "INVALID_HOURS",
            });
          }
          if (hours.open && hours.close && hours.open >= hours.close) {
            console.log(`Validation failed: Close time before open for ${day}`);
            return res.status(400).json({
              success: false,
              message: `La hora de cierre debe ser posterior a la de apertura para ${day}`,
              code: "INVALID_HOURS",
            });
          }
        }
      }
    }
  }

  if (description && description.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Descripción demasiado larga",
      code: "INVALID_DESCRIPTION",
    });
  }

  if (
    logo &&
    !/^https?:\/\/.+(\.(png|jpg|jpeg|svg|webp))(?:\?.*)?$/i.test(logo)
  ) {
    return res.status(400).json({
      success: false,
      message: "URL de logo inválida",
      code: "INVALID_LOGO",
    });
  }

  if (settings) {
    if (
      typeof settings.notifications?.email !== "boolean" ||
      typeof settings.notifications?.sms !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Configuración de notificaciones inválida",
        code: "INVALID_NOTIFICATIONS",
      });
    }
    if (
      typeof settings.laundrySettings?.defaultReadyTime !== "number" ||
      settings.laundrySettings.defaultReadyTime < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Tiempo de preparación inválido",
        code: "INVALID_READY_TIME",
      });
    }
    if (
      typeof settings.laundrySettings?.suavitelEnabled !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Configuración de suavitel inválida",
        code: "INVALID_SUAVITEL",
      });
    }
    if (
      !settings.laundrySettings?.currency ||
      !["MXN", "USD"].includes(settings.laundrySettings.currency)
    ) {
      return res.status(400).json({
        success: false,
        message: "Moneda inválida",
        code: "INVALID_CURRENCY",
      });
    }
    if (!settings.laundrySettings?.timezone) {
      return res.status(400).json({
        success: false,
        message: "Zona horaria inválida",
        code: "INVALID_TIMEZONE",
      });
    }
    if (typeof settings.isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Estado activo inválido",
        code: "INVALID_ACTIVE",
      });
    }
  }

  next();
};

// Ruta para obtener estadísticas
router.get("/statistics", auth, async (req, res) => {
  try {
    console.log("Usuario autenticado:", req.user);
    const businesses = await Business.find({ ownerId: req.user._id });
    console.log("Businesses found:", businesses);

    if (!businesses.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const stats = await Promise.all(
      businesses.map(async (business) => {
        console.log("Procesando negocio:", business._id, business.name);
        const notes = await LaundryNote.find({ businessId: business._id });
        console.log(
          "Notas encontradas para negocio:",
          business._id,
          notes.length
        );
        const totalSales = notes.reduce(
          (sum, note) => sum + (note.total || 0),
          0
        );
        const monthlySales = await LaundryNote.aggregate([
          { $match: { businessId: business._id } },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              total: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
        console.log("Monthly sales para negocio:", business._id, monthlySales);
        return {
          businessId: business._id,
          name: business.name,
          totalSales,
          totalNotes: notes.length,
          monthlySales,
        };
      })
    );

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching business stats:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      code: "SERVER_ERROR",
      error: error.message,
    });
  }
});

// Crear un nuevo negocio
router.post("/", auth, validateBusiness, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    console.log("Usuario autenticado:", req.user);
    const {
      name,
      email,
      phone,
      address,
      businessHours,
      description,
      logo,
      ownerId,
      settings,
    } = req.body;

    if (String(req.user._id) !== String(ownerId) && !req.user.isAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .json({
          success: false,
          message: "No autorizado",
          code: "UNAUTHORIZED",
        });
    }

    console.log("Creando negocio para usuario:", ownerId);

    const processedHours = {};
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    days.forEach((day) => {
      if (businessHours && businessHours[day]) {
        processedHours[day] = {
          isClosed: businessHours[day].isClosed || false,
          open: businessHours[day].isClosed ? null : businessHours[day].open,
          close: businessHours[day].isClosed ? null : businessHours[day].close,
        };
      } else {
        processedHours[day] = { isClosed: true };
      }
    });

    const business = new Business({
      name,
      email,
      phone,
      address,
      businessHours: processedHours,
      description,
      logo,
      ownerId,
      settings,
      isActive: true,
    });

    await business.save({ session });
    console.log("Negocio creado:", business);

    const user = await User.findById(ownerId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({
          success: false,
          message: "Usuario no encontrado",
          code: "USER_NOT_FOUND",
        });
    }

    user.businesses.push(business._id);
    user.defaultBusiness = business._id;
    user.registrationStep = "completed";
    await user.save({ session });

    console.log("Usuario actualizado:", user);

    await session.commitTransaction();
    req.io?.emit("businessCreated", {
      businessId: business._id,
      event: "businessCreated",
      data: business.toObject(),
    });
    res.status(201).json({ success: true, business, businessId: business._id });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error al crear negocio:", err.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Error al crear negocio",
        code: "SERVER_ERROR",
      });
  }
});

// Obtener un negocio
router.get("/:businessId", auth, isBusinessOwner, async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId).lean();
    if (!business) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Negocio no encontrado",
          code: "BUSINESS_NOT_FOUND",
        });
    }

    res.status(200).json({ success: true, business });
  } catch (error) {
    console.error("Error al obtener negocio:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Error del servidor",
        code: "SERVER_ERROR",
      });
  }
});

// Actualizar un negocio
router.patch('/:businessId', auth, isBusinessOwner, validateBusiness, async (req, res) => {
  try {
    const { businessId } = req.params;
    const updates = req.body;

    // Ensure businessHours includes all days
    if (updates.businessHours) {
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const currentBusiness = await Business.findById(businessId);
      if (!currentBusiness) {
        return res.status(404).json({
          success: false,
          message: "Negocio no encontrado",
          code: "BUSINESS_NOT_FOUND",
        });
      }
      const updatedHours = { ...currentBusiness.businessHours };
      days.forEach((day) => {
        if (updates.businessHours[day]) {
          updatedHours[day] = {
            isClosed: updates.businessHours[day].isClosed || false,
            open: updates.businessHours[day].isClosed ? null : updates.businessHours[day].open,
            close: updates.businessHours[day].isClosed ? null : updates.businessHours[day].close,
          };
        }
      });
      updates.businessHours = updatedHours;
    }

    // Remove empty or undefined fields
    Object.keys(updates).forEach(key => {
      if (updates[key] === null || updates[key] === undefined || updates[key] === '') {
        delete updates[key];
      }
    });

    // Update business
    const business = await Business.findByIdAndUpdate(
      businessId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Negocio no encontrado",
        code: "BUSINESS_NOT_FOUND",
      });
    }

    req.io?.emit("businessUpdated", {
      businessId: business._id,
      event: "businessUpdated",
      data: business.toObject(),
    });
    res.status(200).json({ success: true, business });
  } catch (error) {
    console.error("Error updating business:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      code: "SERVER_ERROR",
      error: error.message,
    });
  }
});

// Eliminar un negocio
router.delete("/:businessId", auth, isBusinessOwner, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const businessId = req.params.businessId;
    console.log("Eliminando negocio:", businessId);

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({
          success: false,
          message: "ID de negocio inválido",
          code: "INVALID_BUSINESS_ID",
        });
    }

    const business = await Business.findOne({
      _id: businessId,
      ownerId: req.user._id,
    }).session(session);
    if (!business) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({
          success: false,
          message: "Negocio no encontrado o no autorizado",
          code: "BUSINESS_NOT_FOUND",
        });
    }

    if (business.branches && business.branches.length > 0) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({
          success: false,
          message: "No se puede eliminar un negocio con sucursales activas",
          code: "ACTIVE_BRANCHES",
        });
    }

    if (
      ["active", "trialing"].includes(business.subscription?.status) &&
      business.subscription?.subscriptionId
    ) {
      try {
        await stripe.subscriptions.cancel(business.subscription.subscriptionId);
      } catch (stripeError) {
        console.warn(
          "Error al cancelar suscripción en Stripe:",
          stripeError.message
        );
      }
    }

    await LaundryNote.deleteMany({ businessId }).session(session);
    await Service.deleteMany({ businessId }).session(session);
    await Business.deleteOne({ _id: businessId }).session(session);
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { businesses: businessId },
        $set: {
          defaultBusiness:
            req.user.defaultBusiness === businessId
              ? null
              : req.user.defaultBusiness,
        },
      },
      { session }
    );

    await session.commitTransaction();
    req.io?.emit("businessDeleted", { businessId });
    res
      .status(200)
      .json({
        success: true,
        message: "Negocio y datos asociados eliminados",
        data: { businessId },
      });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error al eliminar negocio:", error.message);
    res.status(error.message.includes("no encontrado") ? 404 : 500).json({
      success: false,
      message: error.message || "Error al eliminar negocio",
      code: error.message.includes("no encontrado")
        ? "BUSINESS_NOT_FOUND"
        : "SERVER_ERROR",
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;