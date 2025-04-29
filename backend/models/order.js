const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  amount_total: { type: Number, required: true, min: 0 },
  unit_amount: { type: Number, min: 0 },
  currency: { type: String, default: "mxn" },
  price_id: { type: String },
  product_id: { type: String },
  image: { type: String },
  productRef: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }
}, { _id: false });

const addressSchema = new mongoose.Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  postal_code: { type: String, required: true },
  country: { type: String, default: "MX" },
  state: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    userId: { 
      type: String,
      required: function() { return !this.guestId; }
    },
    guestId: {
      type: String,
      required: function() { return !this.userId; }
    },
    isGuestOrder: { type: Boolean, default: false },
    customerId: { type: String },
    paymentIntentId: { type: String, required: true },
    payment_method: { type: String },
    products: {
      type: [productSchema],
      validate: {
        validator: function(v) {
          return v.length > 0;
        },
        message: "La orden debe tener al menos un producto"
      }
    },
    subtotal: { type: Number, required: true, min: 0 },
    shipping_cost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    shipping: {
      type: addressSchema,
      required: true
    },
    contact: {
      phone: { 
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^\+?\d{10,15}$/.test(v);
          },
          message: props => `${props.value} no es un número de teléfono válido!`
        }
      },
      email: {
        type: String,
        validate: {
          validator: function(v) {
            if (!v) return true;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: props => `${props.value} no es un email válido!`
        }
      },
      name: { type: String, required: true }
    },
    delivery_status: { 
      type: String, 
      default: "pending",
      enum: ["pending", "processing", "dispatched", "delivered", "cancelled"]
    },
    payment_status: { 
      type: String, 
      required: true,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"]
    },
    notes: { type: String },
    metadata: { type: Object }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

orderSchema.pre('save', async function(next) {
  if (this.isGuestOrder && this.guestId) {
    const guest = await mongoose.model('User').findOne({ _id: this.guestId, isGuest: true });
    if (!guest) {
      return next(new Error('Invalid guestId'));
    }
  }
  if (this.guestId && !this.userId) {
    this.isGuestOrder = true;
  }
  next();
});


orderSchema.index({ userId: 1 });
orderSchema.index({ guestId: 1 });
orderSchema.index({ paymentIntentId: 1 }, { unique: true });
orderSchema.index({ delivery_status: 1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;