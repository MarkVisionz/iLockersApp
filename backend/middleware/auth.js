const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const User = require("../models/user");

// Configuración opcional de Firebase (solo si existen las variables)
if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = async (req, res, next) => {
  try {
    // 1. Obtener token
    const token =
      req.header("x-auth-token") ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado. No autenticado.",
        code: "MISSING_TOKEN",
      });
    }

    // 2. Intentar con Firebase primero (si está configurado)
    if (admin.apps.length) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const validProviders = ["google.com", "facebook.com", "password"];
        if (!validProviders.includes(decodedToken.firebase.sign_in_provider)) {
          return res.status(401).json({
            success: false,
            message: "Proveedor de autenticación no soportado",
            code: "INVALID_PROVIDER",
          });
        }
        req.user = {
          _id: decodedToken.uid,
          email: decodedToken.email,
          isAdmin: decodedToken.isAdmin || false,
          authProvider: decodedToken.firebase.sign_in_provider,
        };
        return next();
      } catch (firebaseError) {
        // Continuar con JWT si Firebase falla
      }
    }

    // 3. Intentar con JWT
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    if (!jwtSecretKey) throw new Error("Falta JWT_SECRET_KEY en .env");
    const decoded = jwt.verify(token, jwtSecretKey);
    req.user = {
      ...decoded,
      authProvider: decoded.authProvider || "password",
    };
    return next();
  } catch (err) {
    console.error("Error en autenticación:", err.message);
    const response = {
      success: false,
      message: "Autenticación fallida",
      code: "AUTH_ERROR",
    };
    if (err.name === "TokenExpiredError" || err.code === "auth/id-token-expired") {
      response.message = "Token expirado. Por favor inicia sesión nuevamente.";
      response.code = "TOKEN_EXPIRED";
      return res.status(401).json(response);
    }
    if (err.name === "JsonWebTokenError" || err.code === "auth/argument-error") {
      response.message = "Token inválido.";
      response.code = "INVALID_TOKEN";
    }
    return res.status(401).json(response);
  }
};

// Middleware para validar guestId
const guestAuth = async (req, res, next) => {
  try {
    const guestId = req.params.guestId || req.body.guestId || req.query.guestId;
    if (!guestId) {
      return res.status(400).json({
        success: false,
        message: "GuestId es requerido",
        code: "MISSING_GUEST_ID",
      });
    }

    const guest = await User.findOne({ guestId, isGuest: true });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Usuario guest no encontrado",
        code: "GUEST_NOT_FOUND",
      });
    }

    if (guest.guestExpiresAt < new Date()) {
      return res.status(403).json({
        success: false,
        message: "Sesión de guest expirada",
        code: "GUEST_EXPIRED",
      });
    }

    req.guest = guest;
    next();
  } catch (err) {
    console.error("Error en guestAuth:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error en validación de guest",
      code: "GUEST_AUTH_ERROR",
    });
  }
};

// For User Profile
const isUser = async (req, res, next) => {
  try {
    // Ejecutar auth si no hay req.user
    if (!req.user) {
      await new Promise((resolve, reject) => {
        auth(req, res, (err) => (err ? reject(err) : resolve()));
      });
    }

    const userIdFromToken = String(req.user._id);
    const userIdFromParams = String(req.params.id);

    // Logs solo en desarrollo
    if (process.env.NODE_ENV !== "production") {
      console.log("🔐 Middleware isUser:");
      console.log("🆔 Token ID:", userIdFromToken);
      console.log("🆔 Params ID:", userIdFromParams);
    }

    if (userIdFromToken === userIdFromParams || req.user.isAdmin) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Acceso denegado. No autorizado.",
      code: "UNAUTHORIZED",
    });
  } catch (error) {
    console.error("Error en isUser:", error.message);
    return res.status(401).json({
      success: false,
      message: "Error de autenticación",
      code: "AUTH_ERROR",
    });
  }
};

// For Admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      await new Promise((resolve, reject) => {
        auth(req, res, (err) => (err ? reject(err) : resolve()));
      });
    }

    if (req.user && req.user.isAdmin) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Solo para administradores.",
      code: "ADMIN_REQUIRED",
    });
  } catch (error) {
    console.error("Error en isAdmin:", error.message);
    return res.status(401).json({
      success: false,
      message: "Error de autenticación",
      code: "AUTH_ERROR",
    });
  }
};

module.exports = {
  auth,
  guestAuth,
  isAdmin,
  isUser,
};