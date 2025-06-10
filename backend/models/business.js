const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del negocio es requerido"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder los 100 caracteres"],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El propietario es requerido"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?\d{7,15}$/, "El teléfono debe ser un número válido"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "La dirección no puede exceder los 200 caracteres"],
    },
    logo: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.*\.(png|jpg|jpeg|svg)$/, "El logo debe ser una URL válida de imagen"],
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    subscription: {
      plan: {
        type: String,
        enum: {
          values: ["starter", "pro", "enterprise"],
          message: "Plan inválido. Use 'starter', 'pro' o 'enterprise'",
        },
        default: "starter",
      },
      active: {
        type: Boolean,
        default: false, // Cambiado a false hasta que se active con Stripe
      },
      renewedAt: {
        type: Date,
        default: Date.now,
      },
      subscriptionId: {
        type: String, // Stripe subscription ID
      },
      stripeCustomerId: {
        type: String, // Stripe customer ID
      },
      status: {
        type: String,
        enum: ["active", "past_due", "canceled", "unpaid", "trialing"],
        default: "unpaid",
      },
    },
  },
  {
    timestamps: true, // createdAt y updatedAt automáticos
  }
);

// Índices para optimizar consultas
BusinessSchema.index({ ownerId: 1 });
BusinessSchema.index({ "subscription.subscriptionId": 1 });
BusinessSchema.index({ "subscription.stripeCustomerId": 1 });

module.exports = mongoose.model("Business", BusinessSchema);