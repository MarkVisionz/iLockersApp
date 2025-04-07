const express = require("express");
const admin = require("firebase-admin");
const { User } = require("../models/user");
const genAuthToken = require("../utils/genAuthToken");

const router = express.Router();
const serviceAccount = require("../utils/firebase-admin.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 🔐 Login con Firebase (Google/Facebook/email-password verificado)
router.post("/firebase-login", async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { email, name } = decoded;

    console.log("📥 Token recibido:", token);
    console.log("📨 Decoded:", decoded);

    let user = await User.findOne({ email });

    // Solo si no existe lo creamos
    if (!user) {
      const nameFromRequest = req.body.name || name || email.split("@")[0];
      user = new User({
        name: nameFromRequest,
        email,
        password: "firebase_oauth",
        isAdmin: false,
      });
      await user.save();
      console.log("🆕 Usuario no encontrado. Creando...");
    }

    const jwt = genAuthToken(user);
    console.log("🔐 JWT generado:", jwt);

    res.status(200).json({
      token: jwt,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.isAdmin ? "admin" : "user",
      },
    });
  } catch (err) {
    console.error("❌ Error al verificar token Firebase:", err.message);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
});

module.exports = router;
