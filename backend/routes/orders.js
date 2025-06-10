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

// Helper to emit stats updates
const emitStatsUpdate = async (req, type = "all") => {
  const previousMonth = moment()
    .subtract(1, "months")
    .startOf("month")
    .toDate();
  const last7Days = moment().subtract(7, "days").toDate();
  try {
    const stats = {};
    if (type === "orders" || type === "all") {
      stats.orders = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: previousMonth },
            delivery_status: { $ne: "cancelled" },
          },
        },
        { $project: { month: { $month: "$createdAt" } } },
        { $group: { _id: "$month", total: { $sum: 1 } } },
      ]);
    }
    if (type === "income" || type === "all") {
      stats.income = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: previousMonth },
            delivery_status: { $ne: "cancelled" },
          },
        },
        { $project: { month: { $month: "$createdAt" }, sales: "$total" } },
        { $group: { _id: "$month", total: { $sum: "$sales" } } },
      ]);
    }
    if (type === "weekly" || type === "all") {
      stats.weekly = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: last7Days },
            delivery_status: { $ne: "cancelled" },
          },
        },
        { $project: { day: { $dayOfWeek: "$createdAt" }, sales: "$total" } },
        { $group: { _id: "$day", total: { $sum: "$sales" } } },
      ]);
    }
    if (req.io) {
      if (stats.orders) {
        console.log("Emitting statsUpdated: orders", stats.orders);
        req.io.emit("statsUpdated", { type: "orders", data: stats.orders });
      }
      if (stats.income) {
        console.log("Emitting statsUpdated: income", stats.income);
        req.io.emit("statsUpdated", { type: "income", data: stats.income });
      }
      if (stats.weekly) {
        console.log("Emitting statsUpdated: weekly", stats.weekly);
        req.io.emit("statsUpdated", { type: "weekly", data: stats.weekly });
      }
    }
  } catch (err) {
    console.error("Error emitting stats:", err.message);
  }
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
      console.log("Emitting orderCreated:", savedOrder._id);
      req.io.emit("orderCreated", savedOrder);
      
      // Notificación específica para guest
      if (guestId) {
        req.io.to(guestId).emit("guestOrderNotification", {
          orderId: savedOrder._id,
          message: "¡Orden recibida! Gracias por tu compra"
        });
      }
      await emitStatsUpdate(req, "all");
    }

    res.status(201).send(savedOrder);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    }
    console.error("Error creating order:", err.message);
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
    console.error("Error fetching guest orders:", err.message);
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

    if (!updatedOrder) {
      return res.status(404).send("Order not found");
    }

    if (req.io) {
      console.log("Emitting orderUpdated:", updatedOrder._id);
      req.io.emit("orderUpdated", updatedOrder);

      // Emitir notificación específica para guest
      if (updatedOrder.isGuestOrder) {
        req.io.emit("guestOrderNotification", {
          orderId: updatedOrder._id,
          message: `Estado actualizado: ${updatedOrder.delivery_status}`,
        });
      }
      await emitStatsUpdate(req, "all");
    }

    res.status(200).send(updatedOrder);
  } catch (err) {
    console.error("Error updating order:", err.message);
    res.status(500).send(err.message);
  }
});

// Eliminar una orden (solo admins)
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).send("Order not found");
    }

    if (req.io) {
      console.log("Emitting orderDeleted:", deletedOrder._id);
      req.io.emit("orderDeleted", deletedOrder);
      await emitStatsUpdate(req, "all");
    }

    res.status(200).send("Order has been deleted...");
  } catch (err) {
    console.error("Error deleting order:", err.message);
    res.status(500).send(err.message);
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
    console.error("Error fetching user orders:", err.message);
    res.status(500).send(err.message);
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const { new: isNew, userId, status } = req.query;
    let query = {};

    // ✅ NUEVO: si es admin y no se pasa userId => traer TODAS las órdenes
    if (req.user.isAdmin && !userId) {
      if (status) {
        query.delivery_status = status;
      }
    }
    // 🧑‍💼 Si se especifica un userId (admin viendo perfil ajeno)
    else if (userId) {
      if (userId !== req.user._id && !req.user.isAdmin) {
        return res.status(403).send("No autorizado para ver órdenes de otros usuarios");
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).send("Usuario no encontrado");

      query = {
        $or: [
          { userId: userId },
          { "contact.email": user.email, isGuestOrder: true }
        ]
      };
    } 
    // 👤 Usuario viendo sus propias órdenes
    else {
      query = {
        $or: [
          { userId: req.user._id },
          { "contact.email": req.user.email, isGuestOrder: true }
        ]
      };
    }

    const orders = isNew
      ? await Order.find(query).sort({ _id: -1 }).limit(4)
      : await Order.find(query).sort({ _id: -1 });

    res.status(200).send(orders);
  } catch (err) {
    console.error("Error fetching orders:", err.message);
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
  } catch (err) {
    console.error("Error fetching order:", err.message);
    res.status(500).send(err.message);
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
      console.log("Emitting statsUpdated: orders", orders);
      req.io.emit("statsUpdated", { type: "orders", data: orders });
    }

    res.status(200).send(orders);
  } catch (err) {
    console.error("Error fetching order stats:", err.message);
    res.status(500).send(err.message);
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
      console.log("Emitting statsUpdated: income", income);
      req.io.emit("statsUpdated", { type: "income", data: income });
    }

    res.status(200).send(income);
  } catch (err) {
    console.error("Error fetching income stats:", err.message);
    res.status(500).send(err.message);
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
      console.log("Emitting statsUpdated: weekly", income);
      req.io.emit("statsUpdated", { type: "weekly", data: income });
    }

    res.status(200).send(income);
  } catch (err) {
    console.error("Error fetching weekly sales:", err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;