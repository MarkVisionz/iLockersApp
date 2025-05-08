const User = require("../models/user");

const refreshUserIfChanged = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(); // Si no hay user en req, sigue normalmente
    }

    const dbUser = await User.findById(req.user._id).lean();
    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado. Token inválido.",
        code: "USER_NOT_FOUND",
      });
    }

    // Verificamos cambios importantes
    const hasCriticalChange =
      dbUser.isAdmin !== req.user.isAdmin ||
      dbUser.isVerified !== req.user.isVerified ||
      dbUser.email !== req.user.email; // (puedes agregar más si quieres)

    if (hasCriticalChange) {
      return res.status(401).json({
        success: false,
        message: "Perfil actualizado. Por favor inicia sesión nuevamente.",
        code: "PROFILE_CHANGED",
      });
    }

    next();
  } catch (error) {
    console.error("Error en refreshUserIfChanged:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error interno al validar cambios de usuario",
      code: "REFRESH_USER_ERROR",
    });
  }
};

module.exports = refreshUserIfChanged;
