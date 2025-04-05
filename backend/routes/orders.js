// backend/routes/orders.js
const { Order } = require("../models/order");
const { auth, isUser, isAdmin } = require("../middleware/auth");
const moment = require("moment");

const router = require("express").Router();

// UPDATE ORDER
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (req.io) {
      req.io.emit("orderUpdated", updatedOrder);
    }

    res.status(200).send(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

// DELETE ORDER
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

// GET USER ORDERS
router.get("/find/:userId", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET ALL ORDERS
router.get("/", async (req, res) => {
  const query = req.query.new;
  try {
    const orders = query
      ? await Order.find().sort({ _id: -1 }).limit(4)
      : await Order.find().sort({ _id: -1 });
    res.status(200).send(orders);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// GET AN ORDER
router.get("/findOne/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).send("Order not found");

    if (
      req.user.isAdmin ||
      order.userId?.toString() === req.user._id.toString()
    ) {
      res.status(200).send(order);
    } else {
      res.status(403).send("Access denied. Not authorized...");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// Agrega estos endpoints modificados para emitir eventos de stats

// ORDER STATS (Monthly) con Socket.IO
router.get("/stats", async (req, res) => {
  const previousMonth = moment()
    .subtract(1, "months")
    .startOf("month")
    .toDate();

  try {
    const orders = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: previousMonth },
          delivery_status: { $ne: "cancelled" }
        }
      },
      { $project: { month: { $month: "$createdAt" } } },
      { $group: { _id: "$month", total: { $sum: 1 } } },
    ]);
    
    // Emitir evento de actualización de stats
    if (req.io) {
      req.io.emit("statsUpdated", { 
        type: "orders", 
        data: orders 
      });
    }
    
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

// INCOME STATS (Monthly Revenue) con Socket.IO
router.get("/income/stats", async (req, res) => {
  const previousMonth = moment()
    .subtract(1, "months")
    .startOf("month")
    .toDate();

  try {
    const income = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: previousMonth },
          delivery_status: { $ne: "cancelled" }
        } 
      },
      { $project: { month: { $month: "$createdAt" }, sales: "$total" } },
      { $group: { _id: "$month", total: { $sum: "$sales" } } },
    ]);
    
    // Emitir evento de actualización de stats
    if (req.io) {
      req.io.emit("statsUpdated", { 
        type: "income", 
        data: income 
      });
    }
    
    res.status(200).send(income);
  } catch (err) {
    res.status(500).send(err);
  }
});

// WEEKLY SALES con Socket.IO
router.get("/week-sales", async (req, res) => {
  const last7Days = moment().subtract(7, "days").toDate();

  try {
    const income = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: last7Days },
          delivery_status: { $ne: "cancelled" }
        } 
      },
      { $project: { day: { $dayOfWeek: "$createdAt" }, sales: "$total" } },
      { $group: { _id: "$day", total: { $sum: "$sales" } } },
    ]);
    
    // Emitir evento de actualización de stats
    if (req.io) {
      req.io.emit("statsUpdated", { 
        type: "weekly", 
        data: income 
      });
    }
    
    res.status(200).send(income);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
