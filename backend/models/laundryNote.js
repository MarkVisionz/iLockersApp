const mongoose = require("mongoose");

const abonoSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ["efectivo", "tarjeta", "transferencia"], required: true },
  date: { type: Date, default: Date.now },
});

const noteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    folio: { type: String, required: true },
    date: { type: Date, required: true },
    services: { type: Object, required: true },
    observations: { type: String },
    abonos: [abonoSchema],
    suavitelDesired: { type: Boolean, default: false },
    total: { type: Number, required: true },
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
      enum: ["efectivo", "tarjeta", "transferencia"],
      default: null,
    },
    phoneNumber: { type: String },
  },
  { timestamps: true }
);

const LaundryNote = mongoose.model("LaundryNote", noteSchema);

exports.LaundryNote = LaundryNote;
