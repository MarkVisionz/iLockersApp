const User = require("../models/user");
const { auth, isUser, isAdmin } = require("../middleware/auth");
const moment = require("moment");
const bcrypt = require("bcrypt");

const router = require("express").Router();

// GET ALL USERS
router.get("/", isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ _id: -1 });
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

// DELETE USER
router.delete("/id", isAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    res.status(200).send(deletedUser);
  } catch (error) {
    res.status(500).send(error);
  }
});

// GET USER BY ID
router.get("/find/:id", isUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      photoURL: user.photoURL,
      authProvider: user.authProvider,
    });
  } catch (error) {
    console.error("Error en /find/:id", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// UPDATE USER
router.put("/:id", isUser, async (req, res) => {
  try {
    const {
      name,
      email,
      newPassword,
      currentPassword,
      photoURL,
      authProvider,
      fromResetFlow,
    } = req.body;

    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 1️⃣ CASO ESPECIAL: Flujo de recuperación de contraseña
    if (fromResetFlow && authProvider === "password") {
      if (!["google.com", "facebook.com"].includes(user.authProvider)) {
        return res.status(400).json({
          message: "Este flujo solo aplica para usuarios autenticados con Google o Facebook",
        });
      }

      user.authProvider = "password";
      const updatedUser = await user.save();

      console.log(`Usuario ${user._id} cambió authProvider a "password" mediante fromResetFlow`);

      // Emitir evento userUpdated
      req.io.to(`user_${user._id}`).emit("userUpdated", {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        photoURL: updatedUser.photoURL,
        authProvider: updatedUser.authProvider,
      });

      return res.status(200).json({
        success: true,
        message: "Método de autenticación actualizado correctamente",
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          photoURL: updatedUser.photoURL,
          authProvider: updatedUser.authProvider,
        },
      });
    }

    // 2️⃣ VALIDACIÓN DE EMAIL DUPLICADO
    if (email && email !== user.email) {
      const emailInUse = await User.findOne({ email });
      if (emailInUse) {
        return res.status(400).json({ message: "Ese correo ya está en uso." });
      }
    }

    // 3️⃣ CAMBIO DE MÉTODO DE AUTENTICACIÓN
    if (authProvider && authProvider !== user.authProvider) {
      if (
        authProvider === "password" &&
        ["google.com", "facebook.com"].includes(user.authProvider)
      ) {
        if (!newPassword) {
          return res.status(400).json({
            message:
              "Se requiere una nueva contraseña para cambiar a autenticación por email/contraseña",
          });
        }
        user.authProvider = "password";
      } else {
        return res.status(403).json({
          message: "Cambio de método de autenticación no permitido",
        });
      }
    }

    // 4️⃣ CAMBIO DE CONTRASEÑA
    if (newPassword) {
      if (user.authProvider !== "password") {
        return res.status(403).json({
          message: "No puedes cambiar la contraseña en este método de autenticación",
        });
      }

      if (!currentPassword) {
        return res.status(400).json({
          message: "Debes ingresar tu contraseña actual para cambiarla",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Contraseña actual incorrecta" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // 5️⃣ ACTUALIZACIÓN DE CAMPOS BÁSICOS
    user.name = name || user.name;
    user.email = email || user.email;
    user.photoURL = photoURL || user.photoURL;

    const updatedUser = await user.save();

    // Emitir evento userUpdated
    console.log(`Emitiendo userUpdated para user_${user._id}`);
    req.io.to(`user_${user._id}`).emit("userUpdated", {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      photoURL: updatedUser.photoURL,
      authProvider: updatedUser.authProvider,
    });

    res.status(200).json({
      success: true,
      message: "Perfil actualizado correctamente",
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        photoURL: updatedUser.photoURL,
        authProvider: updatedUser.authProvider,
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el perfil",
      error: error.message,
    });
  }
});

// GET USER STATS
router.get("/stats", /*isAdmin,*/ async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYYY-MM-DD HH:mm:ss");

  try {
    const users = await User.aggregate([
      {
        $match: { createdAt: { $gte: new Date(previousMonth) } },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);

    res.status(200).send(users);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

module.exports = router;