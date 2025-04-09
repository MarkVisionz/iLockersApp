const express = require("express");
const admin = require("firebase-admin");
const User = require("../models/user"); // ✅ Asegúrate que sea default export
const genAuthToken = require("../utils/genAuthToken");
const cors = require("cors");

const router = express.Router();
router.use(cors());

const serviceAccount = require("../utils/firebase-admin.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 🔐 LOGIN con Firebase
router.post("/firebase-login", async (req, res) => {
  console.log("Iniciando autenticación Firebase");

  try {
    const { token, name: userName } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token requerido" });
    }

    const decoded = await admin.auth().verifyIdToken(token, true);
    const { email, email_verified, uid } = decoded;

    if (!decoded.email_verified && decoded.firebase?.sign_in_provider !== "facebook.com") {
      console.error("Email no verificado para:", decoded.email);
      return res.status(403).json({
        message: "Por favor verifica tu email antes de continuar",
        email: decoded.email,
      });
    }
    

    let user = await User.findOne({ email });

    if (!user) {
      const name = userName || decoded.name || email.split("@")[0];

      user = new User({
        name,
        email,
        password: "firebase_oauth", // clave para detectar login social
        isAdmin: false,
        isVerified: true,
      });

      await user.save();
      console.log("✅ Nuevo usuario creado:", email);
    } else if (!user.name || user.name.trim().length === 0) {
      user.name = userName || decoded.name || email.split("@")[0];
      await user.save();
    }

    const jwtToken = genAuthToken({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    res.status(200).json({
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.isAdmin ? "admin" : "user",
      },
    });
  } catch (error) {
    console.error("❌ Error en firebase-login:", error.message);
    res.status(500).json({
      message: "Error interno del servidor durante el login con Firebase",
      details: error.message,
    });
  }
});

// ✅ REGISTRO vía Firebase (finaliza después de verificación)
router.post("/firebase-register", async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    user = new User({
      email,
      name,
      password,
      isVerified: true,
    });

    await user.save();

    const token = genAuthToken({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Error en firebase-register:", error.message);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

module.exports = router;
