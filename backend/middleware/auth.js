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
    const decoded = jwt.verify(token, jwtSecretKey);
    req.user = decoded;
    next();
  } catch (ex) {
    return res.status(400).json({
      success: false,
      message: "Token inválido.",
    });
  }
};

// For User Profile
const isUser = (req, res, next) => {
  auth(req, res, () => {
    if (req.user && (req.user._id === req.params.id || req.user.isAdmin)) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado. No autorizado.",
      });
    }
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
