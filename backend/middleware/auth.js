const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Acceso denegado. No autenticado.",
    });
  }

  try {
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    if (!jwtSecretKey) throw new Error("Falta JWT_SECRET_KEY en .env");
  
    const decoded = jwt.verify(token, jwtSecretKey);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Error al verificar el token:", err.message);
    return res.status(400).json({
      success: false,
      message: "Token inválido o expirado.",
    });
  }  
};

// For User Profile
const isUser = (req, res, next) => {
  auth(req, res, () => {
    const userIdFromToken = String(req.user._id);
    const userIdFromParams = String(req.params.id);

    console.log("🔐 Middleware isUser:");
    console.log("🆔 Token ID:", userIdFromToken);
    console.log("🆔 Params ID:", userIdFromParams);

    if (userIdFromToken === userIdFromParams || req.user.isAdmin) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Acceso denegado. No autorizado.",
    });
  });
};


// For Admin
const isAdmin = (req, res, next) => {
  auth(req, res, () => {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado. Solo para administradores.",
      });
    }
  });
};

module.exports = {
  auth,
  isAdmin,
  isUser,
};
