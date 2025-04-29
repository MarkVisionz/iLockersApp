const Order = require("../models/order");
const { auth, guestAuth, isUser, isAdmin } = require("../middleware/auth");
const moment = require("moment");
const User = require("../models/user");

const router = require("express").Router();

// Middleware to validate guestId
const validateGuest = async (req, res, next) => {
  const { guestId } = req.body;
  if (!guestId) return next();

  const guest = await User.findOne({
    guestId,
    isGuest: true,
    guestExpiresAt: { $gt: new Date() },
  });

  if (!guest) {
    return res.status(400).json({
      success: false,
      message: "GuestId no válido o sesión expirada",
      code: "INVALID_GUEST",
    });
  }

  req.guest = guest;
  next();
};

// Create order (supports authenticated users and guests)
router.post("/", validateGuest, async (req, res) => {
  try {
    const { userId, guestId, contact, ...orderData } = req.body;

    if (!userId && !guestId) {
      return res.status(400).send("UserId or GuestId is required");
    }

    if (guestId && (!contact || !contact.phone || !contact.name)) {
      return res
        .status(400)
        .send("Contact information (phone, name) is required for guest orders");
    }

    const newOrder = new Order({
      ...orderData,
      userId,
      guestId,
      contact,
      isGuestOrder: !!guestId,
    });

    const savedOrder = await newOrder.save();

    if (req.io) {
      req.io.emit("orderCreated", savedOrder);
      
      // Notificación específica para guest
      if (guestId) {
        req.io.to(guestId).emit("guestOrderNotification", {
          orderId: savedOrder._id,
          message: "¡Orden recibida! Gracias por tu compra"
        });
      }
    }

    res.status(201).send(savedOrder);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    }
    res.status(500).send(err.message);
  }
});

// Get orders for a guest
router.get("/guest/:guestId", guestAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      guestId: req.params.guestId,
      delivery_status: { $ne: "cancelled" }
    }).sort({ createdAt: -1 });
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Actualizar una orden (solo admins)
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (req.io) {
      req.io.emit("orderUpdated", updatedOrder);

      // Emitir notificación específica para guest
      if (updatedOrder.isGuestOrder) {
        req.io.emit("guestOrderNotification", {
          orderId: updatedOrder._id,
          message: `Estado actualizado: ${updatedOrder.delivery_status}`,
        });
      }
    }

    res.status(200).send(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Eliminar una orden (solo admins)
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (req.io) {
      req.io.emit("orderDeleted", deletedOrder);
    }

    res.status(200).send("Order has been deleted...");
  } catch (err) {
    res.status(500).send(err);
  }
});

// Obtener órdenes de un usuario o guest (autenticado)
router.get("/find/:userId", auth, async (req, res) => {
  try {
    if (
      !req.user.isAdmin &&
      req.params.userId !== req.user._id?.toString() &&
      req.params.userId !== req.user.guestId
    ) {
      return res.status(403).send("Access denied. Not authorized...");
    }
    const orders = await Order.find({
      $or: [{ userId: req.params.userId }, { guestId: req.params.userId }],
    }).sort({ createdAt: -1 });

    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

// routes/order.js
router.get("/", auth, async (req, res) => {
  try {
    const { new: isNew, userId, status } = req.query;
    let query = {};

    // Si se especifica un userId (usado cuando admin ve perfil de otro usuario)
    if (userId) {
      // Verificar que sea admin si está pidiendo órdenes de otro usuario
      if (userId !== req.user._id && !req.user.isAdmin) {
        return res.status(403).send("No autorizado para ver órdenes de otros usuarios");
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).send("Usuario no encontrado");

      query = {
        $or: [
          { userId: userId },
          { 
            "contact.email": user.email,
            isGuestOrder: true 
          }
        ]
      };
    } 
    // Si no se especifica userId (usuario viendo su propio perfil)
    else {
      query = {
        $or: [
          { userId: req.user._id },
          { 
            "contact.email": req.user.email,
            isGuestOrder: true 
          }
        ]
      };
    }

    // Filtrar por estado si se especifica
    if (status) {
      query.delivery_status = status;
    }

    const orders = isNew
      ? await Order.find(query).sort({ _id: -1 }).limit(4)
      : await Order.find(query).sort({ _id: -1 });

    res.status(200).send(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send(err.message);
  }
});

// Obtener una orden específica
router.get("/findOne/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).send("Order not found");

    if (
      req.user.isAdmin ||
      order.userId?.toString() === req.user._id?.toString() ||
      order.guestId?.toString() === req.user.guestId?.toString()
    ) {
      res.status(200).send(order);
    } else {
      res.status(403).send("Access denied. Not authorized...");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// Estadísticas de órdenes
router.get("/stats", isAdmin, async (req, res) => {
  const previousMonth = moment()
    .subtract(1, "months")
    .startOf("month")
    .toDate();

  try {
    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: previousMonth },
          delivery_status: { $ne: "cancelled" },
        },
      },
      { $project: { month: { $month: "$createdAt" } } },
      { $group: { _id: "$month", total: { $sum: 1 } } },
    ]);

    if (req.io) {
      req.io.emit("statsUpdated", {
        type: "orders",
        data: orders,
      });
    }

    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Estadísticas de ingresos
router.get("/income/stats", isAdmin, async (req, res) => {
  const previousMonth = moment()
    .subtract(1, "months")
    .startOf("month")
    .toDate();

  try {
    const income = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: previousMonth },
          delivery_status: { $ne: "cancelled" },
        },
      },
      { $project: { month: { $month: "$createdAt" }, sales: "$total" } },
      { $group: { _id: "$month", total: { $sum: "$sales" } } },
    ]);

    if (req.io) {
      req.io.emit("statsUpdated", {
        type: "income",
        data: income,
      });
    }

    res.status(200).send(income);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Ventas semanales
router.get("/week-sales", isAdmin, async (req, res) => {
  const last7Days = moment().subtract(7, "days").toDate();

  try {
    const income = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days },
          delivery_status: { $ne: "cancelled" },
        },
      },
      { $project: { day: { $dayOfWeek: "$createdAt" }, sales: "$total" } },
      { $group: { _id: "$day", total: { $sum: "$sales" } } },
    ]);

    if (req.io) {
      req.io.emit("statsUpdated", {
        type: "weekly",
        data: income,
      });
    }

    res.status(200).send(income);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
