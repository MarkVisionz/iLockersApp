const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { auth, isUser, isAdmin } = require("../middleware/auth");
const moment = require("moment");
const bcrypt = require("bcrypt");
const Order = require("../models/order");
const logger = require("../utils/logger");

// Mejorado: Endpoint para crear usuarios guest con manejo de errores más robusto
router.post("/guest", async (req, res) => {
  try {
    const { email, phone, name } = req.body;

    // Datos mínimos para guest
    const guestData = {
      isGuest: true,
      authProvider: "guest",
      // Usar undefined en lugar de null para campos opcionales
      email: email && typeof email === "string" && email.trim() ? email.trim().toLowerCase() : undefined,
      name: name && typeof name === "string" && name.trim() ? name.trim() : "Invitado",
      phone: phone && typeof phone === "string" && phone.trim() ? phone.trim() : undefined
    };

    // Validación manual de teléfono si se proporciona
    if (guestData.phone && !/^\+?\d{10,15}$/.test(guestData.phone)) {
      return res.status(400).json({
        code: "INVALID_PHONE",
        message: "Formato de teléfono inválido. Use +52 seguido de 10 dígitos",
      });
    }

    // Validación manual de email si se proporciona
    if (guestData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestData.email)) {
      return res.status(400).json({
        code: "INVALID_EMAIL",
        message: "Formato de email inválido",
      });
    }

    // Crear usuario guest
    const guest = new User(guestData);
    const savedGuest = await guest.save();

    logger.info(`Usuario guest creado exitosamente`, {
      guestId: savedGuest._id,
      email: savedGuest.email,
      name: savedGuest.name
    });

    res.status(201).json({
      success: true,
      guestId: savedGuest._id, // Cambiado para usar _id en lugar de guestId
      expiresAt: savedGuest.guestExpiresAt,
      email: savedGuest.email,
      name: savedGuest.name,
    });
  } catch (err) {
    // Log detallado del error
    logger.error("Error detallado en create-guest", {
      errorName: err.name,
      errorMessage: err.message,
      errorCode: err.code,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      bodyData: req.body
    });

    // Manejo específico de errores de MongoDB
    if (err.name === "MongoError" && err.code === 11000) {
      return res.status(409).json({
        code: "DUPLICATE_KEY",
        message: "El email o guestId ya está en uso",
        field: err.keyValue ? Object.keys(err.keyValue)[0] : "desconocido"
      });
    }

    // Manejo de errores de validación de Mongoose
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Error de validación",
        errors
      });
    }

    // Error genérico
    res.status(500).json({
      code: "SERVER_ERROR",
      message: "Error interno del servidor al crear usuario guest",
      detail: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// Convert guest to regular user
router.post("/convert-guest", async (req, res) => {
  try {
    const { guestId, email, password } = req.body;

    const guest = await User.findOne({ guestId, isGuest: true });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest no encontrado",
        code: "GUEST_NOT_FOUND",
      });
    }

    await guest.convertToRegular(email, password);

    await Order.updateMany(
      { guestId },
      { $set: { userId: guest._id, isGuestOrder: false } }
    );

    logger.info("Usuario guest convertido a regular", { guestId, userId: guest._id });

    res.status(200).json({
      success: true,
      message: "¡Cuenta registrada exitosamente!",
      userId: guest._id,
    });
  } catch (err) {
    logger.error("Error en convert-guest", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: err.message,
      code: "CONVERSION_ERROR",
    });
  }
});

// GET ALL USERS
router.get("/", isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ _id: -1 });
    res.status(200).send(users);
  } catch (err) {
    logger.error("Error al obtener usuarios", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    res.status(500).send(err);
  }
});

// DELETE USER
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "Usuario no encontrado" });

    logger.info("Usuario eliminado", { userId: req.params.id });
    res.status(200).send(deletedUser);
  } catch (err) {
    logger.error("Error al eliminar usuario", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    res.status(500).send(err);
  }
});

// GET USER BY ID
router.get("/find/:id", isUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      profileImage: user.profileImage,
      authProvider: user.authProvider,
    });
  } catch (err) {
    logger.error("Error al obtener usuario por ID", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// UPDATE USER
router.put("/:id", isUser, async (req, res) => {
  try {
    const {
      name,
      email,
      newPassword,
      currentPassword,
      profileImage,
      authProvider,
      fromResetFlow,
    } = req.body;

    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (fromResetFlow && authProvider === "password") {
      if (!["google.com", "facebook.com"].includes(user.authProvider)) {
        return res.status(400).json({
          message:
            "Este flujo solo aplica para usuarios autenticados con Google o Facebook",
        });
      }

      user.authProvider = "password";
      const updatedUser = await user.save();

      logger.info(
        `Usuario cambió authProvider a "password" mediante fromResetFlow`,
        { userId: user._id }
      );

      return res.status(200).json({
        success: true,
        message: "Método de autenticación actualizado correctamente",
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          profileImage: updatedUser.profileImage,
          authProvider: updatedUser.authProvider,
        },
      });
    }

    if (email && email !== user.email) {
      const emailInUse = await User.findOne({ email });
      if (emailInUse) {
        return res.status(400).json({ message: "Ese correo ya está en uso." });
      }
    }

    if (authProvider && authProvider !== user.authProvider) {
      if (
        authProvider === "password" &&
        ["google.com", "facebook.com"].includes(user.authProvider)
      ) {
        if (!newPassword) {
          return res.status(400).json({
            message:
              "Se requiere una nueva contraseña para cambiar a autenticación por email/contraseña",
          });
        }
        user.authProvider = "password";
      } else {
        return res.status(403).json({
          message: "Cambio de método de autenticación no permitido",
        });
      }
    }

    if (newPassword) {
      if (user.authProvider !== "password") {
        return res.status(403).json({
          message:
            "No puedes cambiar la contraseña en este método de autenticación",
        });
      }

      if (!currentPassword) {
        return res.status(400).json({
          message: "Debes ingresar tu contraseña actual para cambiarla",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Contraseña actual incorrecta" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    user.name = name && name.trim() ? name.trim() : user.name;
    user.email = email && email.trim() ? email.trim().toLowerCase() : user.email;
    user.profileImage = profileImage || user.profileImage;

    const updatedUser = await user.save();

    logger.info("Usuario actualizado", { userId: user._id });

    res.status(200).json({
      success: true,
      message: "Perfil actualizado correctamente",
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        profileImage: updatedUser.profileImage,
        authProvider: updatedUser.authProvider,
      },
    });
  } catch (err) {
    logger.error("Error al actualizar usuario", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: "Error al actualizar el perfil",
      error: err.message,
    });
  }
});

// GET USER STATS
router.get("/stats", isAdmin, async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYYY-MM-DD HH:mm:ss");

  try {
    const users = await User.aggregate([
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

    res.status(200).send(users);
  } catch (err) {
    logger.error("Error al obtener estadísticas de usuarios", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    res.status(500).send(err);
  }
});

module.exports = router;