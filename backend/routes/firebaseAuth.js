const express = require("express");
const admin = require("firebase-admin");
const User = require("../models/user");
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
  console.log("Iniciando autenticación Firebase:", req.body); // Log temporal

  try {
    const { token, name: userName } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token requerido" });
    }

    const decoded = await admin.auth().verifyIdToken(token, true);
    const { email, email_verified, uid } = decoded;
    const authProvider = decoded.firebase?.sign_in_provider || "password";

    if (!email_verified && authProvider !== "facebook.com") {
      console.log("Email no verificado:", email);
      return res.status(403).json({
        message: "Por favor verifica tu email antes de continuar",
        email,
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const name = userName || decoded.name || email.split("@")[0];
      user = new User({
        name,
        email,
        password: "firebase_oauth",
        isAdmin: false,
        isVerified: true,
        authProvider,
      });
      await user.save();
      console.log("✅ Nuevo usuario creado:", email, "Proveedor:", authProvider);
    } else {
      if (user.authProvider !== authProvider) {
        if (user.authProvider !== "password" && authProvider === "password") {
          console.log(
            `🛠️ Actualizando authProvider de ${email} a "password" (flujo de reset)`
          );
          user.authProvider = "password";
        } else {
          return res.status(400).json({
            message: `Este correo ya está registrado con otro método de autenticación (${user.authProvider})`,
          });
        }
      }

      if (!user.name || user.name.trim().length === 0) {
        user.name = userName || decoded.name || email.split("@")[0];
        await user.save();
      }
    }

    const jwtToken = genAuthToken({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      authProvider: user.authProvider,
    });

    res.status(200).json({
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.isAdmin ? "admin" : "user",
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("❌ Error en firebase-login:", {
      message: error.message,
      code: error.code,
    });
    res.status(500).json({
      message: "Error al procesar la autenticación",
      details: error.message || "Error desconocido",
    });
  }
});

// ✅ REGISTRO vía Firebase
router.post("/firebase-register", async (req, res) => {
  console.log("Iniciando registro Firebase:", req.body); // Log temporal

  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const user = new User({
      email,
      name,
      password,
      isVerified: true,
      authProvider: "password",
    });

    await user.save();

    const token = genAuthToken({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      authProvider: user.authProvider,
    });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("❌ Error en firebase-register:", {
      message: error.message,
      code: error.code,
    });
    res.status(500).json({
      message: "Error al registrar usuario",
      details: error.message || "Error desconocido",
    });
  }
});

module.exports = router;