const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    folio: { type: String, required: true },
    date: { type: Date, required: true },
    services: { type: Object, required: true },
    observations: { type: String },
    abono: { type: Number, default: 0 },
    suavitelDesired: { type: Boolean, default: false },
    total: { type: Number, required: true },
    note_status: { type: String, default: "pendiente" }, // Estado inicial del pago
    cleaning_status: { type: String, default: "sucia" }, // Estado inicial del proceso de la ropa
    paidAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    phoneNumber: { type: String },
  },
  { timestamps: true }
);

const LaundryNote = mongoose.model("LaundryNote", noteSchema);

exports.LaundryNote = LaundryNote;
