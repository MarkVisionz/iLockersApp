const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "El nombre del servicio es requerido"],
    trim: true,
    maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
  },
  type: {
    type: String,
    enum: {
      values: ["simple", "sized"],
      message: "Tipo de servicio inválido. Use 'simple' o 'sized'",
    },
    required: [true, "El tipo de servicio es requerido"],
  },
  price: {
    type: Number,
    min: [0, "El precio no puede ser negativo"],
    required: function () {
      return this.type === "simple";
    },
    default: undefined, // Cambiado de null a undefined
  },

  sizes: {
    type: [
      {
        id: {
          type: String,
          required: true, // Siempre requerido si existe el array
          default: () => new mongoose.Types.ObjectId().toString(), // Generar ID consistente
        },
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: [
            30,
            "El nombre de la talla no puede exceder los 30 caracteres",
          ],
        },
        price: {
          type: Number,
          required: true,
          min: [0, "El precio no puede ser negativo"],
        },
      },
    ],
    required: function () {
      return this.type === "sized";
    },
    default: undefined,
  },
  availableDays: {
    type: [Number],
    validate: {
      validator: function (days) {
        // Permitir array vacío o con días válidos
        return days.length === 0 || days.every((day) => day >= 0 && day <= 6);
      },
      message: "Los días deben ser valores entre 0 (Domingo) y 6 (Sábado)",
    },
    default: [], // Asegurar que siempre haya un array
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

serviceSchema.index({ name: 1 });
serviceSchema.index({ type: 1 });
serviceSchema.index({ createdAt: -1 });

// serviceSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   if (this.type === "sized" && this.price === null) {
//     this.price = undefined;
//   }
//   next();
// });

serviceSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  // Limpieza condicional de campos
  if (this.type === "simple") {
    this.sizes = undefined;
  } else if (this.type === "sized") {
    this.price = undefined;
  }
  
  next();
});

module.exports = mongoose.model("Service", serviceSchema);
