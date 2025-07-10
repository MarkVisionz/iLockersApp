const mongoose = require("mongoose");

const abonoSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  method: {
    type: String,
    enum: ["efectivo", "tarjeta", "transferencia"],
    required: true,
  },
  date: { type: Date, default: Date.now },
});

const noteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    folio: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, default: 1, min: 1 },
        unit: { type: String, default: "pza" },
      },
    ],
    observations: { type: String, trim: true },
    abonos: [abonoSchema],
    suavitelDesired: { type: Boolean, default: false },
    suavitelShots: { type: Number, default: 0, min: 0 },
    suavitelPrice: { type: Number, default: 15, min: 0 },
    total: { type: Number, required: true, min: 0 },
    note_status: {
      type: String,
      enum: ["pendiente", "pagado", "entregado"],
      default: "pendiente",
    },
    cleaning_status: {
      type: String,
      enum: ["sucia", "lavado", "listo_para_entregar", "entregado"],
      default: "sucia",
    },
    paidAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    method: {
      type: String,
      enum: ["efectivo", "tarjeta", "transferencia", null],
      default: null,
    },
    phoneNumber: {
      type: String,
      trim: true,
      validate: {
        validator: (v) =>
          !v || /^\+?\d{7,15}$/.test(v.replace(/[\s\-()]/g, "")),
        message: "Número de teléfono inválido",
      },
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

noteSchema.pre("save", async function (next) {
  const serviceTotal = this.services.reduce(
    (sum, s) => sum + s.price * s.quantity,
    0
  );
  const suavitelCost = this.suavitelShots * this.suavitelPrice;
  const expectedTotal = serviceTotal + suavitelCost;
  if (Math.abs(this.total - expectedTotal) > 0.01) {
    throw new Error("El total no coincide con los precios de los servicios");
  }
  const abonoTotal = this.abonos.reduce((sum, a) => sum + a.amount, 0);
  if (
    this.note_status === "pagado" &&
    this.abonos.length > 0 &&
    abonoTotal < this.total
  ) {
    throw new Error("Los abonos no cubren el total para marcar como pagado");
  }
  if (this.note_status === "pagado" && !this.paidAt) {
    this.paidAt = new Date();
  }
  if (this.note_status === "entregado" && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  const services = await mongoose.model("Service").find({
    _id: { $in: this.services.map((s) => s.serviceId) },
    businessId: this.businessId,
  });
  if (services.length !== this.services.length) {
    throw new Error("Algunos servicios no pertenecen al negocio especificado");
  }
  next();
});

noteSchema.index({ folio: 1, businessId: 1 }, { unique: true });
noteSchema.index({ businessId: 1 });
noteSchema.index({ customerId: 1 });
noteSchema.index({ createdBy: 1 });

const modelName = "LaundryNote";
const LaundryNote =
  mongoose.models[modelName] || mongoose.model(modelName, noteSchema);

module.exports = LaundryNote;
