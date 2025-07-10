const express = require("express");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");
const Order = require("../models/Order");
const genAuthToken = require("../utils/genAuthToken");

const router = express.Router();

// 🔐 Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Error al inicializar Firebase Admin SDK:", error.message);
    throw new Error("Error en la inicialización de Firebase");
  }
}

// 🔍 Middlewares de validación
const validateLoginInput = (req, res, next) => {
  const { token, name } = req.body;
  if (!token)
    return res.status(400).json({ success: false, message: "Token requerido" });
  if (
    name &&
    (typeof name !== "string" || name.length < 3 || name.length > 50)
  ) {
    return res.status(400).json({ success: false, message: "Nombre inválido" });
  }
  next();
};

const validateRegisterInput = (req, res, next) => {
  const { email, name, password } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: "Correo inválido" });
  if (!name || name.length < 3 || name.length > 50)
    return res.status(400).json({ success: false, message: "Nombre inválido" });
  if (!password || password.length < 6)
    return res
      .status(400)
      .json({ success: false, message: "Contraseña demasiado corta" });
  next();
};

// 🔄 Función auxiliar para convertir un guest en usuario real
const convertGuestToUser = async (user, updates, session) => {
  const result = await User.updateOne(
    { _id: user._id },
    { $set: updates, $unset: { guestExpiresAt: "" } },
    { session }
  );
  if (result.modifiedCount === 0)
    throw new Error("No se pudo actualizar el usuario guest");
  return await User.findById(user._id).session(session);
};

// 🔋 LOGIN con Firebase
router.post("/firebase-login", async (req, res) => {
  try {
    const { token, name } = req.body;
    console.log("Procesando POST /auth/firebase-login:", {
      email: req.body.email || "No proporcionado",
      name,
    });

    if (!token) {
      console.log("Token no proporcionado");
      return res
        .status(400)
        .json({
          success: false,
          message: "Token requerido",
          code: "MISSING_TOKEN",
        });
    }

    // Verificar el ID token de Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("Firebase token decodificado:", {
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider: decodedToken.firebase?.sign_in_provider,
    });

    const provider = decodedToken.firebase?.sign_in_provider;
    if (!["google.com", "facebook.com", "password"].includes(provider)) {
      console.log("Proveedor no soportado:", provider);
      return res
        .status(401)
        .json({
          success: false,
          message: "Proveedor no soportado",
          code: "INVALID_PROVIDER",
        });
    }

    // Buscar o crear usuario en MongoDB
    let user = await User.findOne({ email: decodedToken.email }).populate(
      "businesses"
    );
    if (!user) {
      console.log("Creando nuevo usuario para email:", decodedToken.email);
      user = new User({
        email: decodedToken.email,
        name: name || decodedToken.email.split("@")[0],
        authProvider: provider,
        isVerified: true,
        role: "user",
      });
      await user.save();
    } else if (user.authProvider !== provider) {
      console.log(
        "Conflicto de proveedor para email:",
        decodedToken.email,
        "Existente:",
        user.authProvider
      );
      return res
        .status(400)
        .json({
          success: false,
          message: "Correo ya registrado con otro método de autenticación",
          code: "PROVIDER_CONFLICT",
        });
    }

    // Generar JWT local
    const jwtPayload = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin || false,
      role: user.role,
      registrationStep: user.registrationStep || "pending",
      authProvider: user.authProvider,
      isVerified: user.isVerified,
      defaultBusiness: user.defaultBusiness || null,
    };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    console.log("JWT generado:", {
      userId: user._id,
      email: user.email,
      defaultBusiness: user.defaultBusiness,
      businesses: user.businesses,
    });

    res.json({
      success: true,
      token: jwtToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        defaultBusiness: user.defaultBusiness,
        businesses: user.businesses,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error en /auth/firebase-login:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error al autenticar con Firebase",
        code: "SERVER_ERROR",
      });
  }
});

// 🆕 REGISTRO con Firebase
router.post("/firebase-register", validateRegisterInput, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, name, password, role, firebaseUid } = req.body;
    console.log("Register request received:", {
      email,
      name,
      role,
      firebaseUid,
    }); // Depuración

    if (!name || name.trim().length < 3) {
      throw { status: 400, message: "Nombre requerido, mínimo 3 caracteres" };
    }

    let user = await User.findOne({ email }).session(session);

    if (user && !user.isGuest) {
      throw { status: 400, message: "Correo ya registrado" };
    }

    if (user?.isGuest) {
      user = await convertGuestToUser(
        user,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: await bcrypt.hash(password, 10),
          isVerified: false,
          isGuest: false,
          authProvider: "password",
          role,
          registrationStep:
            role === "owner" ? "email_verification" : "completed",
          firebaseUid,
        },
        session
      );
      console.log("Usuario invitado convertido:", {
        email,
        name: name.trim(),
        role,
      });
    } else {
      user = new User({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password: await bcrypt.hash(password, 10),
        isAdmin: false,
        isVerified: false,
        isGuest: false,
        authProvider: "password",
        role,
        registrationStep: role === "owner" ? "email_verification" : "completed",
        firebaseUid,
      });
      console.log("Creando nuevo usuario:", { email, name: name.trim(), role });
      await user.save({ session });
    }

    await Order.updateMany(
      { "contact.email": email, userId: null },
      {
        $set: { userId: user._id, isGuestOrder: false },
        $unset: { guestId: "" },
      },
      { session }
    );

    const tokenJWT = genAuthToken({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      authProvider: user.authProvider,
      isVerified: false,
      role: user.role,
      registrationStep: user.registrationStep,
    });
    console.log("Token generado en /firebase-register:", tokenJWT); // Depuración

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      token: tokenJWT,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        isGuest: user.isGuest,
        authProvider: user.authProvider,
        role: user.role,
        registrationStep: user.registrationStep,
        firebaseUid: user.firebaseUid,
      },
      requiresVerification: true,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Register Firebase Error:", {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
      name: req.body.name,
    });
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error interno",
    });
  }
});

// 📩 Verificar correo
router.post("/verify-email", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email } = req.body;
    let user = await User.findOne({ email }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    const firebaseUser = await admin.auth().getUserByEmail(email);

    if (!firebaseUser.emailVerified) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Email no verificado en Firebase" });
    }

    const nextStep = user.role === "owner" ? "business_setup" : "completed";

    user = await User.findOneAndUpdate(
      { email },
      {
        isVerified: true,
        registrationStep: nextStep,
        lastLogin: new Date(),
      },
      { new: true, session }
    );

    const tokenJWT = genAuthToken({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      authProvider: user.authProvider,
      isVerified: true,
      role: user.role,
      registrationStep: user.registrationStep, // Añadir
    });
    console.log("Token generado:", tokenJWT);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      token: tokenJWT,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        isGuest: user.isGuest,
        authProvider: user.authProvider,
        role: user.role,
        registrationStep: user.registrationStep,
        firebaseUid: user.firebaseUid,
      },
      nextStep,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Verify Email Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al verificar email",
    });
  }
});

// 📧 Enviar link de verificación
router.post("/send-verification-email", async (req, res) => {
  try {
    const { email } = req.body;
    await admin.auth().generateEmailVerificationLink(email, {
      url: process.env.CLIENT_URL || "http://localhost:3000",
    });
    res
      .status(200)
      .json({ success: true, message: "Correo de verificación enviado" });
  } catch (error) {
    console.error("Send Email Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
