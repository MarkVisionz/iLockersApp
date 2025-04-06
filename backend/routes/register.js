const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const Joi = require("joi");
const express = require("express");
const genAuthToken = require("../utils/genAuthToken");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(3).required().messages({
        'string.empty': 'El nombre es requerido',
        'string.min': 'El nombre debe tener al menos {#limit} caracteres',
      }),
      email: Joi.string().min(3).required().email().messages({
        'string.empty': 'El correo es requerido',
        'string.email': 'Debe ingresar un correo válido',
        'string.min': 'El correo debe tener al menos {#limit} caracteres',
      }),
      password: Joi.string().min(6).required().messages({
        'string.empty': 'La contraseña es requerida',
        'string.min': 'La contraseña debe tener al menos {#limit} caracteres',
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

    let user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(400).json({
        success: false,
        errors: [
          {
            field: "email",
            message: "Este correo ya está registrado.",
          },
        ],
      });
    }

    const { name, email, password } = req.body;
    user = new User({ name, email });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const token = genAuthToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.isAdmin ? "admin" : "user",
      },
    });

  } catch (err) {
    console.error("Error en /register:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

module.exports = router;
