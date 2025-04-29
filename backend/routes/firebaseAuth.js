const express = require("express");
const admin = require("firebase-admin");
const User = require("../models/user");
const Order = require("../models/order");
const genAuthToken = require("../utils/genAuthToken");
const cors = require("cors");
const mongoose = require("mongoose");

const router = express.Router();
router.use(cors());

// Inicialización de Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

// 🔐 LOGIN con Firebase
router.post("/firebase-login", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { token, name: userName } = req.body;

    if (!token) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Token requerido" });
    }

    // Verificación del token Firebase
    const decoded = await admin.auth().verifyIdToken(token, true);
    const { email, email_verified } = decoded;
    const authProvider = decoded.firebase?.sign_in_provider || "password";
    
    // Determinar estado de verificación
    const isOAuth = ["google.com", "facebook.com"].includes(authProvider);
    const isVerified = isOAuth || email_verified;

    if (!email_verified && authProvider === "password") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        message: "Por favor verifica tu email antes de continuar",
        email,
      });
    }

    // Buscar usuario con transacción
    let user = await User.findOne({ email }).session(session);
    let isNew = false;

    if (!user) {
      // Crear nuevo usuario
      const name = userName || decoded.name || email.split("@")[0];
      user = new User({
        name,
        email,
        password: "firebase_oauth",
        isAdmin: false,
        isVerified: isVerified,
        isGuest: false,
        authProvider,
      });

      await user.save({ session });
      isNew = true;
      console.log(`✅ Nuevo usuario creado: ${email}`, {
        provider: authProvider,
        verified: isVerified
      });
    } else {
      // Verificar si es un guest y necesita conversión
      if (user.isGuest) {
        console.log(`🔄 Convirtiendo guest a usuario registrado: ${email}`);
        
        // Actualización directa en la base de datos
        const updateResult = await User.updateOne(
          { _id: user._id },
          {
            $set: {
              authProvider,
              isGuest: false,
              isVerified: isVerified,
              name: userName || decoded.name || user.name || email.split("@")[0],
              password: authProvider === "password" ? "hashed_password" : "firebase_oauth"
            },
            $unset: { guestExpiresAt: "" }
          }
        ).session(session);

        if (updateResult.modifiedCount === 0) {
          throw new Error("No se pudo actualizar el usuario guest");
        }

        // Obtener el usuario actualizado
        user = await User.findById(user._id).session(session);
      }

      // Actualizar nombre si es necesario
      if (userName && user.name !== userName) {
        await User.updateOne(
          { _id: user._id },
          { $set: { name: userName } }
        ).session(session);
        user.name = userName;
      }
    }

    // Vincular órdenes de guest
    await Order.updateMany(
      {
        "contact.email": email,
        userId: null,
        isGuestOrder: true,
      },
      {
        $set: {
          userId: user._id,
          isGuestOrder: false,
        },
        $unset: { guestId: "" }
      },
      { session }
    );

    // Generar token JWT
    const jwtToken = genAuthToken({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      authProvider: user.authProvider,
      isVerified: user.isVerified
    });

    // Commit de la transacción
    await session.commitTransaction();
    session.endSession();

    // Emitir evento si es nuevo usuario
    if (isNew && req.io) {
      req.io.emit("userCreated", {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        authProvider: user.authProvider,
      });
    }

    // Respuesta con datos actualizados
    const updatedUser = await User.findById(user._id);
    console.log('Estado final del usuario:', {
      authProvider: updatedUser.authProvider,
      isGuest: updatedUser.isGuest,
      isVerified: updatedUser.isVerified,
      updatedAt: updatedUser.updatedAt
    });

    res.status(200).json({
      token: jwtToken,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        isVerified: updatedUser.isVerified,
        isGuest: updatedUser.isGuest,
        authProvider: updatedUser.authProvider
      },
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error en firebase-login:", {
      message: error.message,
      stack: error.stack,
      user: error.user
    });
    res.status(500).json({
      message: "Error al procesar la autenticación",
      details: error.message,
    });
  }
});

// ✅ REGISTRO con Email/Password
router.post("/firebase-register", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    // Buscar usuario existente
    let user = await User.findOne({ email }).session(session);

    if (user) {
      if (user.isGuest) {
        console.log(`🔄 Convirtiendo guest a usuario registrado: ${email}`);
        
        // Usuario password NO se marca como verificado automáticamente
        const updateResult = await User.updateOne(
          { _id: user._id },
          {
            $set: {
              name,
              password: await bcrypt.hash(password, 10), // Hashear la contraseña
              isVerified: false, // Requiere verificación por email
              isGuest: false,
              authProvider: "password"
            },
            $unset: { guestExpiresAt: "" }
          }
        ).session(session);

        if (updateResult.modifiedCount === 0) {
          throw new Error("No se pudo actualizar el usuario guest");
        }

        user = await User.findById(user._id).session(session);
      } else {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "El correo ya está registrado" });
      }
    } else {
      // Crear nuevo usuario con email/password (no verificado inicialmente)
      user = new User({
        email,
        name,
        password: await bcrypt.hash(password, 10), // Hashear la contraseña
        isAdmin: false,
        isVerified: false, // Requiere verificación
        isGuest: false,
        authProvider: "password",
      });

      await user.save({ session });
      console.log(`✅ Nuevo usuario registrado (pendiente verificación): ${email}`);
      
      // Aquí deberías enviar el email de verificación
      // await sendVerificationEmail(email, user._id);
    }

    // Vincular órdenes de guest
    await Order.updateMany(
      {
        "contact.email": email,
        userId: null,
        isGuestOrder: true,
      },
      {
        $set: {
          userId: user._id,
          isGuestOrder: false,
        },
        $unset: { guestId: "" }
      },
      { session }
    );

    // Generar token JWT (con isVerified: false)
    const jwtToken = genAuthToken({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      authProvider: user.authProvider,
      isVerified: false
    });

    await session.commitTransaction();
    session.endSession();

    // Verificación final
    const updatedUser = await User.findById(user._id);
    if (updatedUser.isGuest) {
      console.error('❌ El usuario sigue siendo guest después de la conversión:', updatedUser);
      throw new Error('La conversión de guest a usuario registrado falló');
    }

    res.status(201).json({
      token: jwtToken,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        isVerified: updatedUser.isVerified,
        isGuest: updatedUser.isGuest,
        authProvider: updatedUser.authProvider
      },
      requiresVerification: true // Indicar al frontend que necesita verificación
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error en firebase-register:", {
      message: error.message,
      stack: error.stack,
      user: error.user
    });
    res.status(500).json({
      message: "Error al registrar usuario",
      details: error.message,
    });
  }
});

// 🔄 Endpoint para verificación de email
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    
    // Aquí deberías verificar el token JWT o el token de verificación
    // Esto es un ejemplo simplificado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isVerified: true } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Generar nuevo token con isVerified: true
    const newToken = genAuthToken({
      _id: updatedUser._id,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      authProvider: updatedUser.authProvider,
      isVerified: true
    });

    res.status(200).json({
      token: newToken,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        isVerified: updatedUser.isVerified,
        authProvider: updatedUser.authProvider
      }
    });

  } catch (error) {
    console.error("❌ Error en verify-email:", error);
    res.status(500).json({
      message: "Error al verificar el email",
      details: error.message,
    });
  }
});

module.exports = router;