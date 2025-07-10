const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [30, "El nombre de la talla no puede exceder los 30 caracteres"],
  },
  price: {
    type: Number,
    required: true,
    min: [0, "El precio no puede ser negativo"],
  },
  unit: {
    type: String,
    default: 'pza', // Unidad por defecto para tallas
  },
});

const serviceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
    },
    type: {
      type: String,
      enum: ["simple", "sized"],
      required: true,
    },
    price: {
      type: Number,
      min: [0, "El precio no puede ser negativo"],
      required: function () {
        return this.type === "simple";
      },
      default: undefined,
    },
    sizes: {
      type: [sizeSchema],
      required: function () {
        return this.type === "sized";
      },
      validate: {
        validator: function (v) {
          return this.type === "sized" ? v.length > 0 : true;
        },
        message: "Se requiere al menos una talla para servicios con tallas",
      },
      default: function () {
        return this.type === "sized" ? [] : undefined;
      },
    },
    availableDays: {
      type: [Number],
      validate: {
        validator: (days) => days.every((day) => day >= 0 && day <= 6),
        message: "Los días deben ser entre 0 (Domingo) y 6 (Sábado)",
      },
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
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
    unit: {
      type: String,
      default: 'pza', // Unidad por defecto para servicios simples
      required: function() { return this.type === 'simple'; }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

serviceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  if (this.isModified("name")) {
    this.name = this.name.trim().replace(/\b\w/g, (l) => l.toUpperCase());
  }
  if (this.type === "simple") {
    this.sizes = undefined;
  } else if (this.type === "sized") {
    this.price = undefined;
  }
  next();
});

serviceSchema.index({ businessId: 1, name: 1 }, { unique: true });
serviceSchema.index({ type: 1 });
serviceSchema.index({ createdAt: -1 });
serviceSchema.index({ isActive: 1 });

module.exports = mongoose.model("Service", serviceSchema);
