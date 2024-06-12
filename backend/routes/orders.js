const { Order } = require("../models/order");
const { auth, isUser, isAdmin } = require("../middleware/auth");
const moment = require("moment");

const router = require("express").Router();

//UPDATE
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).send(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

//DELETE
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).send("Order has been deleted...");
  } catch (err) {
    res.status(500).send(err);
  }
});

//GET USER ORDERS
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

    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (req.user.isAdmin || order.userId.toString() === req.user._id.toString()) {
      res.status(200).send(order);
    } else {
      res.status(403).send("Access denied. Not authorized...");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});


// Get Orders Stats

router.get(
  "/stats",
  /*isAdmin,*/ async (req, res) => {
    const previousMonth = moment()
      .month(moment().month() - 1)
      .set("date", 1)
      .format("YYYY-MM-DD HH:mm:ss");

    try {
      const orders = await Order.aggregate([
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

      res.status(200).send(orders);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  }
);

// Get Income Stats

router.get(
  "/income/stats",
  /*isAdmin,*/ async (req, res) => {
    const previousMonth = moment()
      .month(moment().month() - 1)
      .set("date", 1)
      .format("YYYY-MM-DD HH:mm:ss");

    try {
      const income = await Order.aggregate([
        {
          $match: { createdAt: { $gte: new Date(previousMonth) } },
        },
        {
          $project: {
            month: { $month: "$createdAt" },
            sales: "$total",
          },
        },
        {
          $group: {
            _id: "$month",
            total: { $sum: "$sales" },
          },
        },
      ]);

      res.status(200).send(income);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  }
);

// Get 1 Week Sales

router.get(
  "/week-sales",
  /*isAdmin,*/ async (req, res) => {
    const last7Days = moment()
      .day(moment().month() - 7)
      .format("YYYY-MM-DD HH:mm:ss");

    try {
      const income = await Order.aggregate([
        {
          $match: { createdAt: { $gte: new Date(last7Days) } },
        },
        {
          $project: {
            day: { $dayOfWeek: "$createdAt" },
            sales: "$total",
          },
        },
        {
          $group: {
            _id: "$day",
            total: { $sum: "$sales" },
          },
        },
      ]);

      res.status(200).send(income);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  }
);

module.exports = router;
