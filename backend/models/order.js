const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  amount_total: { type: Number, required: true },
  unit_amount: { type: Number }, // Nuevo
  currency: { type: String, default: "mxn" }, // Nuevo
  price_id: { type: String }, // Nuevo (Stripe price id)
  product_id: { type: String }, // Nuevo (Stripe product id)
  image: { type: String },
}, { _id: false });


const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: false },
    customerId: { type: String },
    paymentIntentId: { type: String },
    products: [productSchema],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    shipping: { type: Object, required: true },
    phone: { type: String },
    customer_name: { type: String },
    delivery_status: { type: String, default: "pending" },
    payment_status: { type: String, required: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
exports.Order = Order;
