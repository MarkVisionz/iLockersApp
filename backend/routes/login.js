const bcrypt = require("bcrypt");
const User = require("../models/user"); // ✅ sin destructuring
const Joi = require("joi");
const express = require("express");
const genAuthToken = require("../utils/genAuthToken");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Limitar intentos para prevenir ataques de fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: "Demasiados intentos de login. Intenta más tarde.",
  skipSuccessfulRequests: true,
});

router.post("/", loginLimiter, async (req, res) => {
  try {
    // Validación de entrada
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.empty": "El correo es requerido",
        "string.email": "Por favor ingresa un correo válido",
      }),
      password: Joi.string().min(6).max(1024).required().messages({
        "string.empty": "La contraseña es requerida",
        "string.min": "La contraseña debe tener al menos {#limit} caracteres",
      }),
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));
      return res.status(400).json({ success: false, errors });
    }

    // Buscar usuario (case-insensitive)
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${req.body.email}$`, "i") },
    }).select("+password +loginAttempts +isLocked +lockUntil");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos",
      });
    }

    // Verificar si la cuenta es social (Google, Facebook, Apple)
    if (user.password === "firebase_oauth") {
      return res.status(400).json({
        success: false,
        message: "Esta cuenta fue creada con Google/Facebook/Apple. Por favor inicia sesión con ese método.",
      });
    }

    // Verificar si está bloqueado
    if (user.isLocked && user.lockUntil > Date.now()) {
      const minutos = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Tu cuenta está bloqueada. Intenta de nuevo en ${minutos} minutos.`,
      });
    }

    // Validar contraseña
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      await User.findByIdAndUpdate(user._id, {
        $inc: { loginAttempts: 1 },
        ...(user.loginAttempts + 1 >= 5 && {
          isLocked: true,
          lockUntil: Date.now() + 15 * 60 * 1000,
        }),
      });

      const remainingAttempts = Math.max(0, 5 - (user.loginAttempts + 1));
      return res.status(401).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Contraseña incorrecta. Intentos restantes: ${remainingAttempts}`
            : "Tu cuenta ha sido bloqueada por múltiples intentos fallidos.",
        remainingAttempts,
      });
    }

    // Resetear contadores si el login fue exitoso
    if (user.loginAttempts > 0 || user.isLocked) {
      await User.findByIdAndUpdate(user._id, {
        loginAttempts: 0,
        isLocked: false,
        lockUntil: null,
      });
    }

    // Generar token
    const token = genAuthToken(user);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

module.exports = router;
