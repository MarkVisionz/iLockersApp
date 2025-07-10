const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const mongoose = require("mongoose");
const User = require("../models/user");

// Inicializar Firebase Admin si no está ya inicializado
if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

// ✅ Middleware principal: autentica con JWT o Firebase
const auth = async (req, res, next) => {
  try {
    const token =
      req.header("x-auth-token") ||
      (req.headers.authorization?.startsWith("Bearer ") &&
        req.headers.authorization.split(" ")[1]);

    console.log('Token recibido:', token ? 'Presente' : 'Ausente');

    if (!token) {
      return res.status(401).json({ success: false, message: "Token requerido", code: "MISSING_TOKEN" });
    }

    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    if (!jwtSecretKey) throw new Error("Falta JWT_SECRET_KEY");

    // Intentar verificar como JWT
    try {
      const decoded = jwt.verify(token, jwtSecretKey);
      console.log('JWT decodificado:', decoded);
      const user = await User.findById(decoded._id);
      if (!user) throw new Error("Usuario no encontrado");
      req.user = {
        _id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        role: user.role,
        defaultBusiness: user.defaultBusiness ? user.defaultBusiness.toString() : null,
        authProvider: user.authProvider || "password",
      };
      console.log('Usuario autenticado (JWT):', req.user);
      return next();
    } catch (jwtError) {
      console.log("JWT inválido, intentando Firebase:", jwtError.message);
    }

    // Intentar verificar como Firebase
    if (admin.apps.length) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('Firebase token decodificado:', decodedToken);
        const provider = decodedToken.firebase?.sign_in_provider;

        if (!["google.com", "facebook.com", "password"].includes(provider)) {
          return res.status(401).json({ success: false, message: "Proveedor no soportado", code: "INVALID_PROVIDER" });
        }

        const userInDb = await User.findOne({ email: decodedToken.email });
        if (!userInDb) {
          return res.status(404).json({ success: false, message: "Usuario no encontrado", code: "USER_NOT_FOUND" });
        }

        req.user = {
          _id: userInDb._id,
          email: userInDb.email,
          isAdmin: userInDb.isAdmin,
          isVerified: userInDb.isVerified,
          role: userInDb.role,
          defaultBusiness: userInDb.defaultBusiness ? userInDb.defaultBusiness.toString() : null,
          authProvider: provider,
        };
        console.log('Usuario autenticado (Firebase):', req.user);
        return next();
      } catch (firebaseError) {
        console.error("Firebase Error:", firebaseError.message);
      }
    }

    return res.status(401).json({ success: false, message: "Token inválido", code: "INVALID_TOKEN" });
  } catch (err) {
    console.error("Error en auth:", err.message);
    return res.status(401).json({ success: false, message: "Error de autenticación", code: "AUTH_ERROR" });
  }
};

// ✅ Middleware para usuarios invitados (guest)
const guestAuth = async (req, res, next) => {
  try {
    const guestId = req.params.guestId || req.body.guestId || req.query.guestId;
    if (!guestId) {
      return res.status(400).json({ success: false, message: "GuestId requerido", code: "MISSING_GUEST_ID" });
    }

    const guest = await User.findOne({ _id: guestId, isGuest: true });
    if (!guest) return res.status(404).json({ success: false, message: "Guest no encontrado", code: "GUEST_NOT_FOUND" });
    if (guest.guestExpiresAt < new Date()) {
      return res.status(403).json({ success: false, message: "Sesión guest expirada", code: "GUEST_EXPIRED" });
    }

    req.guest = guest;
    next();
  } catch (err) {
    console.error("Error en guestAuth:", err.message);
    return res.status(500).json({ success: false, message: "Error validando guest", code: "GUEST_AUTH_ERROR" });
  }
};

// ✅ Middleware para validar que el usuario accede a su propio perfil
const isUser = async (req, res, next) => {
  try {
    if (!req.user) await auth(req, res, () => {});
    const tokenId = String(req.user._id);
    const paramId = String(req.params.id);

    if (tokenId === paramId || req.user.isAdmin) return next();

    return res.status(403).json({ success: false, message: "Acceso denegado", code: "UNAUTHORIZED" });
  } catch (err) {
    console.error("Error en isUser:", err.message);
    return res.status(401).json({ success: false, message: "Error de autenticación", code: "AUTH_ERROR" });
  }
};

// ✅ Middleware para administradores del sistema
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) await auth(req, res, () => {});
    if (req.user?.isAdmin) return next();

    return res.status(403).json({ success: false, message: "Solo para administradores", code: "ADMIN_REQUIRED" });
  } catch (err) {
    console.error("Error en isAdmin:", err.message);
    return res.status(401).json({ success: false, message: "Error de autenticación", code: "AUTH_ERROR" });
  }
};

// ✅ Middleware para dueños de negocios (owners)
const isBusinessOwner = async (req, res, next) => {
  try {
    if (!req.user) await auth(req, res, () => {});
    const businessId = req.headers.businessid || req.headers.businessId || req.params.businessId || req.body.businessId || req.query.businessId;
    console.log("isBusinessOwner - Headers:", req.headers);
    console.log("isBusinessOwner - businessId recibido:", businessId);
    console.log("isBusinessOwner - user:", req.user);

    if (!businessId) {
      console.error("isBusinessOwner - BusinessId requerido");
      return res.status(400).json({ success: false, message: "BusinessId requerido", code: "MISSING_BUSINESS_ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      console.error("isBusinessOwner - BusinessId inválido:", businessId);
      return res.status(400).json({ success: false, message: "BusinessId inválido", code: "INVALID_BUSINESS_ID" });
    }

    const business = await mongoose.model("Business").findById(businessId);
    if (!business) {
      console.error("isBusinessOwner - Negocio no encontrado:", businessId);
      return res.status(404).json({ success: false, message: "Negocio no encontrado", code: "BUSINESS_NOT_FOUND" });
    }

    const user = await User.findById(req.user._id).populate("businesses");
    const isOwner = user.businesses.some((b) => b._id.equals(business._id));

    if (!isOwner && !req.user.isAdmin) {
      console.error("isBusinessOwner - No autorizado para businessId:", businessId, "userId:", req.user._id);
      return res.status(403).json({ success: false, message: "No autorizado para este negocio", code: "UNAUTHORIZED" });
    }

    if (!business.isActive) {
      console.error("isBusinessOwner - Negocio no activo:", businessId);
      return res.status(403).json({ success: false, message: "Negocio no activo", code: "BUSINESS_INACTIVE" });
    }

    req.businessId = businessId;
    next();
  } catch (err) {
    console.error("Error en isBusinessOwner:", err.message);
    return res.status(500).json({ success: false, message: "Error en autenticación", code: "AUTH_ERROR" });
  }
};

// ✅ Middleware que bloquea acceso si el usuario no ha terminado su registro
const checkRegistrationStep = async (req, res, next) => {
  try {
    if (!req.user) await auth(req, res, () => {});
    const user = await User.findById(req.user._id);

    if (user.role === "owner" && user.registrationStep !== "completed") {
      return res.status(403).json({ success: false, message: "Registro de negocio incompleto", code: "REGISTRATION_INCOMPLETE" });
    }

    next();
  } catch (err) {
    console.error("Error en checkRegistrationStep:", err.message);
    return res.status(401).json({ success: false, message: "Error de autenticación", code: "AUTH_ERROR" });
  }
};

module.exports = {
  auth,
  guestAuth,
  isUser,
  isAdmin,
  isBusinessOwner,
  checkRegistrationStep,
};